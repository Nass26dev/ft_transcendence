import logging
import time
from datetime import date, timedelta

from celery import shared_task

from django.db.models import Q

from sports.scraper.client import fetch_page
from sports.scraper.footlive import parse_matches_page
from sports.scraper.upsert import upsert_matches
from sports.models import Match
from sports.services.odds import compute_odds_for_queryset
from sports.services.settle import settle_finished_matches
from sports.services.details import enrich_match
from sports.services.logos import fetch_team_logos
from django.utils import timezone

logger = logging.getLogger(__name__)

REQUEST_DELAY = 2

DETAILS_BATCH = 12

NEAR_KICKOFF = timedelta(hours=2)
REFRESH_EVERY = timedelta(minutes=10)


def _enrich_pending(limit: int = DETAILS_BATCH) -> int:
    """Enrichit les fiches par priorité, dans la limite du lot (DETAILS_BATCH
    fiches par passage, par politesse envers foot-live et pour rester rapide).

    1. live          → (re)scrapé à chaque passage (événements en direct),
    2. programmés    → backfill une fois dès qu'ils sont en base (compos /
       arbitre / stade dispo des jours à l'avance sur foot-live), puis
       rafraîchis près du coup d'envoi (NEAR_KICKOFF, fenêtre de 2h) pour
       capter la compo officielle / les changements de dernière minute, au
       plus une fois toutes les REFRESH_EVERY (10 min),
    3. terminés      → scrapé une seule fois (details_fetched_at vide).
    """
    now = timezone.now()
    base = Match.objects.exclude(detail_url="")

    live = list(base.filter(status="live").order_by("kickoff_at"))

    scheduled = list(
        base.filter(status="scheduled").filter(
            Q(details_fetched_at__isnull=True)
            | Q(
                kickoff_at__range=(now - timedelta(minutes=15), now + NEAR_KICKOFF),
                details_fetched_at__lt=now - REFRESH_EVERY,
            )
        ).order_by("kickoff_at")
    )

    finished = list(
        base.filter(status="finished", details_fetched_at__isnull=True)
        .order_by("-kickoff_at")
    )
    matches = (live + scheduled + finished)[:limit]

    enriched = 0
    for i, match in enumerate(matches):
        if enrich_match(match):
            enriched += 1
        if i < len(matches) - 1:
            time.sleep(REQUEST_DELAY)
    return enriched


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
    """Tâche périodique principale : scrape le jour courant, recalcule les
    cotes des matchs du jour, règle les paris des matchs qui viennent de se
    terminer, puis enrichit les fiches (compos, arbitre, événements) des
    matchs bientôt joués, en direct, puis fraîchement terminés.
    """
    created, updated = _scrape_day(date.today())
    today = date.today()
    qs = Match.objects.filter(kickoff_at__date=today)
    n = compute_odds_for_queryset(qs)
    settled = settle_finished_matches()
    enriched = _enrich_pending()
    return {
        "total_created": created,
        "total_updated": updated,
        "odds_computed": n,
        "bets_settled": settled,
        "details_enriched": enriched,
    }


@shared_task(name="sports.scrape_upcoming")
def scrape_upcoming() -> dict:
    """Scrape les matchs à venir (J+1 à J+7) et calcule leurs cotes."""
    summary = _scrape_range(1, 7)
    now = timezone.now()
    qs = Match.objects.filter(
        status="scheduled",
        kickoff_at__range=(now, now + timedelta(days=7)),
    )
    summary["odds_computed"] = compute_odds_for_queryset(qs)
    return summary


@shared_task(name="sports.scrape_details")
def scrape_details(limit: int = DETAILS_BATCH) -> dict:
    """Enrichit les fiches détaillées (déclenchable seul, ex. backfill)."""
    return {"details_enriched": _enrich_pending(limit)}


@shared_task(name="sports.fetch_logos")
def fetch_logos() -> dict:
    """Renseigne les logos d'equipes manquants (TheSportsDB)."""
    return {"team_logos_found": fetch_team_logos()}


@shared_task(name="sports.settle_bets")
def settle_bets() -> dict:
    """Règle les paris des matchs terminés/annulés (déclenchable seul)."""
    return {"bets_settled": settle_finished_matches()}


@shared_task(name="sports.scrape_history")
def scrape_history() -> dict:
    """Historique — J-180 à J-1.

    À lancer uniquement une fois au démarrage :
    python manage.py shell -c "from sports.tasks import scrape_history; scrape_history.delay()"
    """
    return _scrape_range(-180, -1)