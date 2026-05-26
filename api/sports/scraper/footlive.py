import logging
from datetime import datetime
from zoneinfo import ZoneInfo

from bs4 import BeautifulSoup

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
        })

    logger.info("%d matchs parsés", len(results))
    return results