"""
matches/management/commands/fetch_matches.py

Scrape footlive.fr → met à jour Match et Standing.
Slugs compétition alignés sur le front : L1 | UCL | PL | LIGA | BUN | SA
"""

import logging
import re
import time
from datetime import datetime, timezone, date

import requests
from bs4 import BeautifulSoup
from django.core.management.base import BaseCommand
from django.db import transaction

from matches.models import Match, Standing

logger = logging.getLogger(__name__)

BASE_URL = "https://www.footlive.fr"

# slug front → (nom lisible, chemin matchs, chemin classement)
LEAGUES = {
    "L1":   ("Ligue 1", "/france/ligue-1/", "/classement/france/ligue-1/"),
    "PL":   ("Premier League", "/angleterre/premier-league/", "/classement/angleterre/premier-league/"),
    "BUN":  ("Bundesliga", "/allemagne/bundesliga/", "/classement/allemagne/bundesliga/"),
    "LIGA": ("La Liga", "/espagne/liga/", "/classement/espagne/liga/"),
    "SA":   ("Serie A", "/italie/serie-a/", "/classement/italie/serie-a/"),
    "PPL":  ("Primeira Liga", "/portugal/primeira-liga/", "/classement/portugal/primeira-liga/"),
    "L2":   ("Ligue 2", "/france/ligue-2/", "/classement/france/ligue-2"),
}

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "fr-FR,fr;q=0.9",
    "Referer": "https://www.footlive.fr/",
}

REQUEST_DELAY = 2  # secondes entre chaque requête


# ---------------------------------------------------------------------------
# HTTP
# ---------------------------------------------------------------------------

def fetch_page(path: str) -> BeautifulSoup | None:
    url = BASE_URL + path
    try:
        resp = requests.get(url, headers=HEADERS, timeout=15)
        resp.raise_for_status()
        resp.encoding = "utf-8"
        return BeautifulSoup(resp.text, "html.parser")
    except requests.RequestException as exc:
        logger.error("Erreur HTTP %s : %s", url, exc)
        return None


# ---------------------------------------------------------------------------
# Parsers
# ---------------------------------------------------------------------------

def parse_datetime(raw: str) -> datetime | None:
    """
    Tente de parser une date/heure depuis les formats footlive.
    Retourne un datetime UTC-aware, ou None.
    """
    raw = raw.strip()

    for fmt in ("%d/%m/%Y %H:%M", "%d/%m/%Y"):
        try:
            dt = datetime.strptime(raw[:len(fmt) + 2], fmt)
            return dt.replace(tzinfo=timezone.utc)
        except ValueError:
            pass

    # "Aujourd'hui 21:00" / "Demain 18:00"
    m = re.search(r"(\d{2}:\d{2})", raw)
    if m:
        today = datetime.now(tz=timezone.utc)
        h, mn = map(int, m.group(1).split(":"))
        return today.replace(hour=h, minute=mn, second=0, microsecond=0)

    return None


def parse_score(raw: str) -> tuple[int | None, int | None]:
    m = re.search(r"(\d+)\s*[-–]\s*(\d+)", raw)
    if m:
        return int(m.group(1)), int(m.group(2))
    return None, None


def parse_minute(raw: str) -> int | None:
    m = re.search(r"(\d+)'", raw)
    return int(m.group(1)) if m else None


def scrape_matches(soup: BeautifulSoup, comp: str) -> list[dict]:
    """Retourne une liste de dicts prêts pour upsert_matches."""
    results = []

    # Pattern principal : lignes de tableau
    rows = soup.select("table tr")
    for row in rows:
        cells = row.find_all("td")
        if len(cells) < 3:
            continue
        texts = [c.get_text(" ", strip=True) for c in cells]

        # Cherche la cellule équipes
        home, away = None, None
        for t in texts:
            parts = re.split(r"\s+[-–]\s+|\s+vs\s+", t, maxsplit=1, flags=re.I)
            if len(parts) == 2 and len(parts[0]) > 1:
                home, away = parts[0].strip(), parts[1].strip()
                break

        if not home or not away:
            continue

        # Score ou statut live
        score_str = next((t for t in texts if re.match(r"^\d+\s*[-–]\s*\d+$", t)), None)
        score_home, score_away = parse_score(score_str) if score_str else (None, None)

        minute = next((parse_minute(t) for t in texts if re.search(r"\d+'", t)), None)

        if minute is not None:
            status = "live"
        elif score_home is not None:
            status = "finished"
        else:
            status = "soon"

        # Date/heure
        dt = next((parse_datetime(t) for t in texts if parse_datetime(t)), None)

        results.append({
            "competition": comp,
            "home_team":   home,
            "away_team":   away,
            "time":        dt or datetime.now(tz=timezone.utc),
            "status":      status,
            "minute":      minute,
            "home_score":  score_home,
            "away_score":  score_away,
        })

    logger.info("[%s] %d matchs scrapés", comp, len(results))
    return results


def scrape_standings(soup: BeautifulSoup, comp: str) -> list[dict]:
    """Retourne une liste de dicts prêts pour upsert_standings."""
    results = []

    table = (
        soup.find("table", class_=re.compile(r"classement|standing", re.I))
        or soup.find("table", id=re.compile(r"classement|standing", re.I))
        or soup.find("table")
    )
    if not table:
        logger.warning("[%s] Tableau classement introuvable", comp)
        return results

    for i, row in enumerate(table.find_all("tr")):
        cells = row.find_all(["td", "th"])
        if len(cells) < 8:
            continue
        texts = [c.get_text(strip=True) for c in cells]

        if texts[0].lower() in ("rang", "#", "cl", "pos", ""):
            continue

        try:
            rank = int(re.sub(r"\D", "", texts[0])) if re.search(r"\d", texts[0]) else i
            team_name = next(
                (t for t in texts[1:] if len(t) > 2 and not re.match(r"^-?\d+$", t)), None
            )
            if not team_name:
                continue

            nums = []
            for t in texts:
                cleaned = t.replace("-", "", 1) if t.startswith("-") else t
                if re.match(r"^\d+$", cleaned):
                    nums.append(int(t))

            if len(nums) >= 7:
                played, wins, draws, losses = nums[0], nums[1], nums[2], nums[3]
                goals_for, goals_against    = nums[4], nums[5]
                points                      = nums[-1]
            elif len(nums) >= 2:
                played = nums[0]
                points = nums[-1]
                wins = draws = losses = goals_for = goals_against = 0
            else:
                continue

            results.append({
                "competition":   comp,
                "team_name":     team_name,
                "rank":          rank,
                "played":        played,
                "wins":          wins,
                "draws":         draws,
                "losses":        losses,
                "goals_for":     goals_for,
                "goals_against": goals_against,
                "goal_diff":     goals_for - goals_against,
                "points":        points,
            })
        except (ValueError, IndexError) as exc:
            logger.debug("Ligne classement ignorée : %s", exc)

    logger.info("[%s] %d équipes classement", comp, len(results))
    return results


# ---------------------------------------------------------------------------
# Upserts
# ---------------------------------------------------------------------------

@transaction.atomic
def upsert_matches(match_list: list[dict]) -> tuple[int, int]:
    created = updated = 0
    for data in match_list:
        try:
            _, is_new = Match.objects.update_or_create(
                competition=data["competition"],
                home_team=data["home_team"],
                away_team=data["away_team"],
                # On évite les doublons sur la même journée
                time__date=data["time"].date(),
                defaults={
                    "time":       data["time"],
                    "status":     data["status"],
                    "minute":     data.get("minute"),
                    "home_score": data.get("home_score"),
                    "away_score": data.get("away_score"),
                },
            )
            if is_new:
                created += 1
            else:
                updated += 1
        except Exception as exc:
            logger.error("Erreur upsert match %s vs %s : %s",
                         data.get("home_team"), data.get("away_team"), exc)
    return created, updated


@transaction.atomic
def upsert_standings(standing_list: list[dict]) -> tuple[int, int]:
    created = updated = 0
    for data in standing_list:
        try:
            _, is_new = Standing.objects.update_or_create(
                competition=data["competition"],
                team_name=data["team_name"],
                defaults={k: v for k, v in data.items()
                           if k not in ("competition", "team_name")},
            )
            if is_new:
                created += 1
            else:
                updated += 1
        except Exception as exc:
            logger.error("Erreur upsert standing %s : %s", data.get("team_name"), exc)
    return created, updated


# ---------------------------------------------------------------------------
# Commande Django
# ---------------------------------------------------------------------------

class Command(BaseCommand):
    help = "Scrape footlive.fr et met à jour matchs + classements"

    def add_arguments(self, parser):
        parser.add_argument(
            "--leagues", nargs="+",
            choices=list(LEAGUES.keys()),
            default=list(LEAGUES.keys()),
        )
        parser.add_argument("--skip-standings", action="store_true")
        parser.add_argument("--skip-matches",   action="store_true")

    def handle(self, *args, **options):
        total_mc = total_mu = total_sc = total_su = 0

        for slug in options["leagues"]:
            name, matches_path, standings_path = LEAGUES[slug]
            self.stdout.write(f"\n🏆  {name} ({slug})")

            if not options["skip_matches"]:
                soup = fetch_page(matches_path)
                if soup:
                    mc, mu = upsert_matches(scrape_matches(soup, slug))
                    total_mc += mc; total_mu += mu
                    self.stdout.write(self.style.SUCCESS(f"   Matchs    : {mc} créés, {mu} MàJ"))
                time.sleep(REQUEST_DELAY)

                if not options["skip_standings"] and standings_path:
                    soup = fetch_page(standings_path)
                    if soup:
                        sc, su = upsert_standings(scrape_standings(soup, slug))
                        total_sc += sc
                        total_su += su
                        self.stdout.write(self.style.SUCCESS(f"   Classement: {sc} créés, {su} MàJ"))
                    time.sleep(REQUEST_DELAY)
                else:
                    self.stdout.write(self.style.WARNING(f"   Classement ignoré (pas de URL pour {slug})"))
                time.sleep(REQUEST_DELAY)

        self.stdout.write("\n" + "=" * 50)
        self.stdout.write(self.style.SUCCESS(
            f"✅  Matchs {total_mc}+{total_mu} | Classements {total_sc}+{total_su}"
        ))