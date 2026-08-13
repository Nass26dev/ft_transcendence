import logging
from django.db import transaction
from django.utils.text import slugify

from sports.models import Sport, Competition, Team, Match

logger = logging.getLogger(__name__)


def get_or_create_football() -> Sport:
    """Récupère (ou crée) le sport « Football »."""
    sport, _ = Sport.objects.get_or_create(
        slug="football",
        defaults={"name": "Football"},
    )
    return sport


def get_or_create_competition(slug: str, name: str) -> Competition:
    """Récupère (ou crée) une compétition de football pour la saison courante."""
    sport = get_or_create_football()
    competition, _ = Competition.objects.get_or_create(
        sport=sport,
        slug=slug,
        defaults={"name": name, "season": "2025-2026"},
    )
    return competition


def get_or_create_team(competition: Competition, name: str) -> Team:
    """Récupère (ou crée) une équipe au sein d'une compétition."""
    team, _ = Team.objects.get_or_create(
        competition=competition,
        name=name,
        defaults={"short_name": name[:20]},
    )
    return team


@transaction.atomic
def upsert_matches(match_list: list[dict]) -> tuple[int, int]:
    """Insert ou update les matchs. Retourne (created, updated)."""
    created = updated = 0

    for data in match_list:
        try:
            competition = get_or_create_competition(
                data["competition_slug"],
                data["competition_name"],
            )
            home_team = get_or_create_team(competition, data["home_team"])
            away_team = get_or_create_team(competition, data["away_team"])

            _, is_new = Match.objects.update_or_create(
                external_id=data["external_id"],
                defaults={
                    "competition": competition,
                    "home_team": home_team,
                    "away_team": away_team,
                    "kickoff_at": data["kickoff_at"],
                    "status": data["status"],
                    "current_minute": data.get("current_minute"),
                    "home_score": data.get("home_score"),
                    "away_score": data.get("away_score"),
                    "footlive_id": data.get("footlive_id", ""),
                    "detail_url": data.get("detail_url", ""),
                },
            )
            if is_new:
                created += 1
            else:
                updated += 1
        except Exception as exc:
            logger.error(
                "Erreur upsert match %s vs %s : %s",
                data.get("home_team"), data.get("away_team"), exc,
            )
    return created, updated