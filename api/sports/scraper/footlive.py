import logging
import re
from datetime import datetime, timezone
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

LEAGUES = {
    "L1":   ("Ligue 1", "/france/ligue-1/"),
    "PL":   ("Premier League", "/angleterre/premier-league/"),
    "BUN":  ("Bundesliga", "/allemagne/bundesliga/"),
    "LIGA": ("La Liga", "/espagne/liga/"),
    "SA":   ("Serie A", "/italie/serie-a/"),
    "PPL":  ("Primeira Liga", "/portugal/primeira-liga/"),
    "L2":   ("Ligue 2", "/france/ligue-2/"),
}

def parse_datetime(raw: str) -> datetime | None:
    raw = raw.strip()
    for fmt in ("%d/%m/%Y %H:%M", "%d/%m/%Y"):
        try:
            dt = datetime.strptime(raw[: len(fmt) + 2], fmt)
            return dt.replace(tzinfo=timezone.utc)
        except ValueError:
            pass

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


def parse_matches_page(
    soup: BeautifulSoup, 
    competition_slug: str,
    competition_name: str,
    ) -> list[dict]:
    """Extrait les matchs depuis la page HTML d'une compétition."""
    results = []

    rows = soup.select("table tr")
    for row in rows:
        cells = row.find_all("td")
        if len(cells) < 3:
            continue
        texts = [c.get_text(" ", strip=True) for c in cells]

        home, away = None, None
        for t in texts:
            parts = re.split(r"\s+[-–]\s+|\s+vs\s+", t, maxsplit=1, flags=re.I)
            if len(parts) == 2 and len(parts[0]) > 1:
                home, away = parts[0].strip(), parts[1].strip()
                break

        if not home or not away:
            continue

        score_str = next((t for t in texts if re.match(r"^\d+\s*[-–]\s*\d+$", t)), None)
        score_home, score_away = parse_score(score_str) if score_str else (None, None)
        minute = next((parse_minute(t) for t in texts if re.search(r"\d+'", t)), None)

        if minute is not None:
            status = "live"
        elif score_home is not None:
            status = "finished"
        else:
            status = "scheduled"

        dt = next((parse_datetime(t) for t in texts if parse_datetime(t)), None)

        # external_id stable pour idempotence : slug-equipe1-equipe2-date
        kickoff = dt or datetime.now(tz=timezone.utc)
        external_id = f"footlive:{competition_slug}:{home}:{away}:{kickoff:%Y%m%d}".lower().replace(" ", "-")

        results.append({
            "competition_slug": competition_slug,
            "competition_name": competition_name,
            "home_team": home,
            "away_team": away,
            "kickoff_at": kickoff,
            "status": status,
            "current_minute": minute,
            "home_score": score_home,
            "away_score": score_away,
            "external_id": external_id,
        })

    logger.info("[%s] %d matchs parsés", competition_slug, len(results))
    return results