import logging

from django.db import transaction
from django.utils import timezone

from sports.models import Match, MatchEvent, MatchLineup
from sports.scraper.client import fetch_page
from sports.scraper.footlive import parse_match_detail

logger = logging.getLogger(__name__)


@transaction.atomic
def _store_detail(match: Match, detail: dict) -> None:
    """Met à jour la méta du match et remplace ses événements/compositions.

    Les événements et compositions existants sont supprimés puis recréés :
    la fiche foot-live est considérée comme la source de vérité, sans fusion.
    """
    meta = detail.get("meta", {})
    for field in ("referee", "venue", "stage", "ht_home_score", "ht_away_score"):
        if field in meta:
            setattr(match, field, meta[field])
    match.details_fetched_at = timezone.now()
    match.save(update_fields=[
        "referee", "venue", "stage", "ht_home_score", "ht_away_score",
        "details_fetched_at",
    ])

    match.events.all().delete()
    match.lineups.all().delete()
    MatchEvent.objects.bulk_create(
        MatchEvent(match=match, **e) for e in detail.get("events", [])
    )
    MatchLineup.objects.bulk_create(
        MatchLineup(match=match, **p) for p in detail.get("lineups", [])
    )


def enrich_match(match: Match) -> bool:
    """Scrape la fiche détaillée d'un match et la stocke. Retourne True si OK.

    Le parsing est protégé par un try/except défensif : un match dont la fiche
    est cassée ou inattendue ne doit pas interrompre le traitement du lot.
    """
    if not match.detail_url:
        return False
    soup = fetch_page(match.detail_url)
    if soup is None:
        return False
    try:
        detail = parse_match_detail(soup)
        _store_detail(match, detail)
    except Exception as exc:
        logger.error("Enrichissement %s échoué : %s", match.detail_url, exc)
        return False
    logger.info(
        "Détails %s : %d événements, %d joueurs",
        match.detail_url, len(detail["events"]), len(detail["lineups"]),
    )
    return True
