import logging
import time
from datetime import date, timedelta

from celery import shared_task

from sports.scraper.client import fetch_page
from sports.scraper.footlive import parse_matches_page
from sports.scraper.upsert import upsert_matches
from sports.models import Match
from sports.services.odds import compute_odds_for_queryset
from django.utils import timezone

logger = logging.getLogger(__name__)

REQUEST_DELAY = 2


def _scrape_day(day: date) -> tuple[int, int]:
    """Scrape une journée. Renvoie (created, updated)."""
    path = f"/resultats/{day:%d-%m-%Y}/"
    soup = fetch_page(path)
    if soup is None:
        return 0, 0
    parsed = parse_matches_page(soup)
    return upsert_matches(parsed)


def _scrape_range(start_offset: int, end_offset: int) -> dict:
    """Scrape de J+start à J+end inclus."""
    summary = {"total_created": 0, "total_updated": 0}
    today = date.today()

    for offset in range(start_offset, end_offset + 1):
        created, updated = _scrape_day(today + timedelta(days=offset))
        summary["total_created"] += created
        summary["total_updated"] += updated
        time.sleep(REQUEST_DELAY)

    return summary


@shared_task(name="sports.scrape_live")
def scrape_live() -> dict:
    created, updated = _scrape_day(date.today())
    # recalcule les cotes des matchs du jour
    today = date.today()
    qs = Match.objects.filter(kickoff_at__date=today)
    n = compute_odds_for_queryset(qs)
    return {"total_created": created, "total_updated": updated, "odds_computed": n}


@shared_task(name="sports.scrape_upcoming")
def scrape_upcoming() -> dict:
    summary = _scrape_range(1, 7)
    now = timezone.now()
    qs = Match.objects.filter(
        status="scheduled",
        kickoff_at__range=(now, now + timedelta(days=7)),
    )
    summary["odds_computed"] = compute_odds_for_queryset(qs)
    return summary


# Lancer uniquement une fois au demarrage : python manage.py shell -c "from sports.tasks import scrape_history; scrape_history.delay()"
@shared_task(name="sports.scrape_history")
def scrape_history() -> dict:
    """Historique — J-180 à J-1."""
    return _scrape_range(-180, -1)