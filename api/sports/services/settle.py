"""Règlement des paris une fois les matchs terminés.

Appelé après le scraping live : pour chaque match passé en `finished`
(ou `cancelled`), on règle les paris encore `pending` et on crédite le
wallet des gagnants.
"""
import logging

from django.db import transaction
from django.db.models import F
from django.utils import timezone

from sports.models import Match
from betting.models import Bet

logger = logging.getLogger(__name__)


def _winning_selection(match: Match) -> str | None:
    """Sélection gagnante (home/draw/away) d'un match terminé, ou None."""
    if match.home_score is None or match.away_score is None:
        return None
    if match.home_score > match.away_score:
        return "home"
    if match.home_score < match.away_score:
        return "away"
    return "draw"


@transaction.atomic
def settle_match(match: Match) -> int:
    """Règle les paris en attente d'un seul match. Renvoie le nombre réglé.

    Verrouille les paris (select_for_update) pour éviter un double règlement
    si deux tâches tournent en parallèle.
    """
    pending = (
        Bet.objects
        .select_for_update()
        .filter(match=match, status="pending")
        .select_related("odd")
    )

    # Match annulé : on rembourse la mise, sans gain.
    if match.status == "cancelled":
        count = 0
        for bet in pending:
            _credit(bet.user_id, bet.stake)
            bet.status = "cancelled"
            bet.settled_at = timezone.now()
            bet.save(update_fields=["status", "settled_at"])
            count += 1
        return count

    if match.status != "finished":
        return 0

    winner = _winning_selection(match)
    if winner is None:
        logger.warning("Match %s terminé sans score, règlement reporté", match.pk)
        return 0

    count = 0
    for bet in pending:
        if bet.odd.selection == winner:
            payout = bet.stake * bet.odd_value
            _credit(bet.user_id, payout)
            bet.status = "won"
        else:
            bet.status = "lost"
        bet.settled_at = timezone.now()
        bet.save(update_fields=["status", "settled_at"])
        count += 1

    return count


def _credit(user_id: int, amount) -> None:
    """Crédite le wallet d'un utilisateur (mise à jour atomique en base)."""
    from django.contrib.auth import get_user_model

    User = get_user_model()
    User.objects.filter(pk=user_id).update(wallet=F("wallet") + amount)


def settle_finished_matches() -> int:
    """Règle tous les matchs terminés/annulés ayant encore des paris en attente.

    Renvoie le nombre total de paris réglés.
    """
    matches = (
        Match.objects
        .filter(status__in=["finished", "cancelled"], bets__status="pending")
        .distinct()
    )

    total = 0
    for match in matches:
        total += settle_match(match)

    if total:
        logger.info("Règlement : %s paris réglés", total)

    return total
