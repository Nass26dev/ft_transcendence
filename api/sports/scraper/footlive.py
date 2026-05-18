import logging
from datetime import datetime
from zoneinfo import ZoneInfo

from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

PARIS = ZoneInfo("Europe/Paris")

LEAGUES = {
    "L1":   ("Ligue 1",        "/france/ligue-1/"),
    "PL":   ("Premier League", "/angleterre/premier-league/"),
    "BUN":  ("Bundesliga",     "/allemagne/bundesliga/"),
    "LIGA": ("La Liga",        "/espagne/liga/"),
    "SA":   ("Serie A",        "/italie/serie-a/"),
    "PPL":  ("Primeira Liga",  "/portugal/primeira-liga/"),
    "L2":   ("Ligue 2",        "/france/ligue-2/"),
    "UK": ("UK premiere league","/ukraine/premier-league/"),
    "ALL": ("ALL matchday","/resultats/18-05-2026/"),
}


def parse_matches_page(
    soup: BeautifulSoup,
    competition_slug: str,
    competition_name: str,
) -> list[dict]:
    """Extrait les matchs depuis les data-attributes des éléments .feedGame."""
    results = []

    for game in soup.select(".feedGame"):
        home = game.get("data-team1")
        away = game.get("data-team2")
        if not home or not away:
            continue

        # Score
        score_home = game.get("data-score1")
        score_away = game.get("data-score2")
        score_home = int(score_home) if score_home and score_home.isdigit() else None
        score_away = int(score_away) if score_away and score_away.isdigit() else None

        # Minute
        minute_raw = game.get("data-minute")
        minute = int(minute_raw) if minute_raw and minute_raw.isdigit() else None

        # Statut
        status_raw = game.get("data-status", "")
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
        dt_fr = game.get("data-dt_fr", "")
        try:
            kickoff = datetime.strptime(dt_fr, "%Y-%m-%d %H:%M").replace(tzinfo=PARIS)
        except ValueError:
            kickoff = datetime.now(tz=PARIS)
            logger.warning("[%s] date invalide: %r", competition_slug, dt_fr)

        external_id = (
            f"footlive:{competition_slug}:{home}:{away}:{kickoff:%Y%m%d}"
            .lower()
            .replace(" ", "-")
        )

        results.append({
            "competition_slug": competition_slug,
            "competition_name": competition_name,
            "home_team":        home,
            "away_team":        away,
            "kickoff_at":       kickoff,
            "status":           status,
            "current_minute":   minute,
            "home_score":       score_home,
            "away_score":       score_away,
            "external_id":      external_id,
        })

    logger.info("[%s] %d matchs parsés", competition_slug, len(results))
    return results