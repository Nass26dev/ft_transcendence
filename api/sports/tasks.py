import logging
import time

from celery import shared_task
from django.utils.text import slugify

from sports.models import Sport, Competition, Team, Match
from sports.scraper.client import fetch_page
from sports.scraper.footlive import LEAGUES, parse_matches_page
from sports.scraper.upsert import upsert_matches

logger = logging.getLogger(__name__)

REQUEST_DELAY = 2


@shared_task(name="sports.scrape_all_matches")
def scrape_all_matches() -> dict:
    summary = {"total_created": 0, "total_updated": 0}

    for slug, (name, path) in LEAGUES.items():
        soup = fetch_page(path)
        if soup is None:
            continue

        parsed = parse_matches_page(soup, slug, competition_name=name)
        created, updated = upsert_matches(parsed)
        summary["total_created"] += created
        summary["total_updated"] += updated
        time.sleep(REQUEST_DELAY)

    return summary