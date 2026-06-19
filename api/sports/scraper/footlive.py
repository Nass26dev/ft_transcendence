import logging
import re
from datetime import datetime
from zoneinfo import ZoneInfo

from bs4 import BeautifulSoup, Tag

logger = logging.getLogger(__name__)

PARIS = ZoneInfo("Europe/Paris")

LEAGUES = {
    "france/ligue-1":            ("Ligue 1",          "ligue-1"),
    "france/ligue-2":            ("Ligue 2",          "ligue-2"),
    "angleterre/premier-league": ("Premier League",   "premier-league"),
    "allemagne/bundesliga":      ("Bundesliga",       "bundesliga"),
    "espagne/liga":              ("La Liga",          "la-liga"),
    "italie/serie-a":            ("Serie A",          "serie-a"),
    "portugal/primeira-liga":    ("Primeira Liga",    "primeira-liga"),
    "ukraine/premier-league":    ("Premier League UA", "premier-league-ua"),
    "monde/coupe-du-monde":      ("Coupe du monde",   "coupe-du-monde"),
}

RESTE_DU_MONDE = ("Reste du monde", "reste-du-monde")


def match_competition(href: str) -> tuple[str, str]:
    """france/ligue-1/barrages/ → ('Ligue 1', 'ligue-1'). Fallback : Reste du monde."""
    clean = href.strip("/")
    for fragment, (name, slug) in LEAGUES.items():
        if clean.startswith(fragment):
            return name, slug
    return RESTE_DU_MONDE


def parse_matches_page(soup: BeautifulSoup) -> list[dict]:
    """Extrait les matchs en suivant les sections de compétition."""
    results = []
    current_comp_name, current_comp_slug = RESTE_DU_MONDE

    # Parcourt compLink et feedGame dans l'ordre du document
    for el in soup.select(".compLink, .feedGame"):
        classes = el.get("class", [])

        if "compLink" in classes:
            href = el.get("href", "")
            current_comp_name, current_comp_slug = match_competition(href)
            continue

        # ── ici el est un .feedGame ──
        home = el.get("data-team1")
        away = el.get("data-team2")
        if not home or not away:
            continue

        footlive_id = el.get("data-id", "")
        link = el.select_one(".match_event a[href]")
        detail_url = link.get("href", "") if link else ""

        score_home = el.get("data-score1")
        score_away = el.get("data-score2")
        score_home = int(score_home) if score_home and score_home.isdigit() else None
        score_away = int(score_away) if score_away and score_away.isdigit() else None

        minute_raw = el.get("data-minute")
        minute = int(minute_raw) if minute_raw and minute_raw.isdigit() else None

        status_raw = el.get("data-status", "")
        if minute is not None:
            status = "live"
        elif status_raw in ("Term.", "Res", "Fin prol.", "Fin pen."):
            status = "finished"
        elif status_raw in ("1 MT", "2 MT", "MT", "Prol.", "Pen."):
            status = "live"
        elif score_home is not None and score_away is not None and status_raw not in ("-", ""):
            status = "finished"
        else:
            status = "scheduled"

        dt_fr = el.get("data-dt_fr", "")
        try:
            kickoff = datetime.strptime(dt_fr, "%Y-%m-%d %H:%M").replace(tzinfo=PARIS)
        except ValueError:
            kickoff = datetime.now(tz=PARIS)
            logger.warning("[%s] date invalide: %r", current_comp_slug, dt_fr)

        external_id = (
            f"footlive:{current_comp_slug}:{home}:{away}:{kickoff:%Y%m%d}"
            .lower()
            .replace(" ", "-")
        )

        results.append({
            "competition_slug": current_comp_slug,
            "competition_name": current_comp_name,
            "home_team":        home,
            "away_team":        away,
            "kickoff_at":       kickoff,
            "status":           status,
            "current_minute":   minute,
            "home_score":       score_home,
            "away_score":       score_away,
            "external_id":      external_id,
            "footlive_id":      footlive_id,
            "detail_url":       detail_url,
        })

    logger.info("%d matchs parsés", len(results))
    return results


# ════════════════════════════════════════════════════════════════════
#  Fiche détaillée d'un match : /resultat/<home>-<away>-<date>/
# ════════════════════════════════════════════════════════════════════

# Classe CSS de l'icône foot-live → type d'événement.
_EVENT_ICON = {
    "tgoal": "goal",
    "tog":   "own_goal",
    "tpen":  "penalty",
    "tyc":   "yellow_card",
    "trc":   "red_card",
    "subs":  "substitution",
}


def _text(el: Tag | None) -> str:
    return el.get_text(" ", strip=True) if el else ""


def _parse_minute(block: Tag) -> int | None:
    m = re.search(r"(\d+)(?:\s*\+\s*\d+)?\s*'", block.get_text(" ", strip=True))
    return int(m.group(1)) if m else None


def _parse_events(soup: BeautifulSoup) -> list[dict]:
    """Buts / cartons / remplacements, alignés par index sur 3 colonnes
    (gauche = domicile, centre = minute+icône, droite = extérieur)."""
    events: list[dict] = []
    for tbl in soup.select("#match-actions .match-detail"):
        first_td = tbl.select_one("td")
        # Les compositions partagent la même table : on les saute ici.
        if first_td is None or "compo" in " ".join(first_td.get("class", [])):
            continue
        row = tbl.select_one("tr.t_a")
        if row is None:
            continue

        left = row.select_one(".t_a_a")
        center = row.select_one(".t_a_b")
        right = row.select_one(".t_a_c")
        lrows = left.find_all("div", recursive=False) if left else []
        rrows = right.find_all("div", recursive=False) if right else []
        blocks = center.select(".eventScoreGoalCard, .eventScoreSub") if center else []

        for i, block in enumerate(blocks):
            img = block.select_one(".eventImage")
            icon_classes = [c for c in img.get("class", []) if c != "eventImage"] if img else []
            etype = next((_EVENT_ICON[c] for c in icon_classes if c in _EVENT_ICON), None)
            if etype is None:
                continue

            lcell = lrows[i] if i < len(lrows) else None
            rcell = rrows[i] if i < len(rrows) else None
            if _text(lcell):
                side, cell = "home", lcell
            elif _text(rcell):
                side, cell = "away", rcell
            else:
                continue

            player_out = ""
            if etype == "substitution":
                # "Entrant <br> Sortant"
                names = list((cell.find("div") or cell).stripped_strings)
                player = names[0] if names else _text(cell)
                player_out = names[1] if len(names) >= 2 else ""
            else:
                # Nettoie un éventuel suffixe " (csc)".
                player = re.sub(r"\s*\(csc\)\s*$", "", _text(cell)).strip()

            events.append({
                "minute":     _parse_minute(block),
                "type":       etype,
                "team_side":  side,
                "player":     player[:120],
                "player_out": player_out[:120],
            })
    return events


def _parse_lineups(soup: BeautifulSoup) -> list[dict]:
    """Compositions : titulaires (.composition) et remplaçants (.remplacants)."""
    players: list[dict] = []
    for role, selector in (("starter", ".composition"), ("substitute", ".remplacants")):
        block = soup.select_one(selector)
        if block is None:
            continue
        row = block.select_one("tr")
        if row is None:
            continue
        for side, sel in (("home", ".t_a_a"), ("away", ".t_a_c")):
            cell = row.select_one(sel)
            if cell is None:
                continue
            for entry in cell.find_all("div", recursive=False):
                span = entry.find("span")
                number = None
                name = _text(entry)
                if span and span.get_text(strip=True).isdigit():
                    number = int(span.get_text(strip=True))
                    name = name.split(str(number), 1)[-1].strip()
                if name:
                    players.append({
                        "team_side": side,
                        "role":      role,
                        "number":    number,
                        "player":    name[:120],
                    })
    return players


# Marqueurs de phase reconnus dans "Compétition: <nom> <phase>".
_STAGE_RE = re.compile(
    r"(Groupe\s+\w+"
    r"|Journée\s+\d+|\d+\s*(?:[èe]re|[èe]me|er)?\s*journée"
    r"|Quarts?\s+de\s+finale|Demi[- ]finales?|Finale|Barrages?"
    r"|Play[- ]?offs?|Promotion\s+Play[- ]?offs?"
    r"|1/\d+\s+de\s+finale|Tour\s+[\w-]+|[\w-]+\s+tour|Phase\s+[\w-]+)\s*$",
    re.IGNORECASE,
)


def _extract_stage(comp_text: str) -> str:
    """'Coupe du monde, Groupe A' ou 'Coupe du monde Groupe C' → 'Groupe A/C'."""
    if "," in comp_text:
        return comp_text.split(",", 1)[1].strip()
    m = _STAGE_RE.search(comp_text)
    return m.group(1).strip() if m else ""


def _parse_meta(soup: BeautifulSoup) -> dict:
    """Arbitre, stade, phase, score à la mi-temps."""
    meta: dict = {}
    for li in soup.select("#match-resume li"):
        text = li.get_text(" ", strip=True)
        if text.startswith("Arbitre") and ":" in text:
            meta["referee"] = text.split(":", 1)[1].strip()[:120]
        elif text.startswith("Stade") and ":" in text:
            meta["venue"] = text.split(":", 1)[1].strip()[:120]
        elif text.startswith("Compétition") and ":" in text:
            stage = _extract_stage(text.split(":", 1)[1].strip())
            if stage:
                meta["stage"] = stage[:120]

    for h3 in soup.select("#match-actions h3"):
        m = re.search(r"1\s*[èe]?re\s+mi-temps\s*(\d+)\s*-\s*(\d+)", h3.get_text(" ", strip=True))
        if m:
            meta["ht_home_score"] = int(m.group(1))
            meta["ht_away_score"] = int(m.group(2))
            break
    return meta


def parse_match_detail(soup: BeautifulSoup) -> dict:
    """Extrait méta + événements + compositions d'une fiche match foot-live."""
    return {
        "meta":     _parse_meta(soup),
        "events":   _parse_events(soup),
        "lineups":  _parse_lineups(soup),
    }