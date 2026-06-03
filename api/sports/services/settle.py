"""Règlement des paris une fois les matchs terminés.

Appelé après le scraping live : pour chaque match passé en `finished`
(ou `cancelled`), on règle les jambes (`BetSelection`) encore `pending`, puis
on résout chaque ticket impacté :

- une jambe perdante → ticket perdu (la mise est déjà retenue) ;
- toutes les jambes décidées et au moins une gagnante → ticket gagné, on crédite
  la mise × produit des cotes des jambes gagnantes (les jambes annulées comptent
  pour 1, comme un void) ;
- toutes les jambes annulées → remboursement de la mise ;
- sinon (jambes encore en attente) → le ticket reste pending.
"""
import logging
from decimal import Decimal

from django.db import transaction
from django.db.models import F
from django.utils import timezone

from sports.models import Match
from betting.models import Bet, BetSelection
from notifications.services import notify

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
    """Règle les jambes en attente d'un seul match. Renvoie le nombre de jambes réglées.

    Verrouille les jambes (select_for_update) pour éviter un double règlement
    si deux tâches tournent en parallèle.
    """
    pending = (
        BetSelection.objects
        .select_for_update()
        .filter(match=match, status="pending")
        .select_related("odd")
    )

    if match.status == "cancelled":
        new_status_for = lambda leg: "cancelled"
    elif match.status == "finished":
        winner = _winning_selection(match)
        if winner is None:
            logger.warning("Match %s terminé sans score, règlement reporté", match.pk)
            return 0
        new_status_for = lambda leg: "won" if leg.odd.selection == winner else "lost"
    else:
        return 0

    now = timezone.now()
    affected_bet_ids = set()
    count = 0
    for leg in pending:
        leg.status = new_status_for(leg)
        leg.settled_at = now
        leg.save(update_fields=["status", "settled_at"])
        affected_bet_ids.add(leg.bet_id)
        count += 1

    for bet_id in affected_bet_ids:
        _resolve_ticket(bet_id, now)

    return count


def _resolve_ticket(bet_id: int, now) -> None:
    """Résout un ticket si toutes ses jambes sont décidées (ou dès qu'une perd)."""
    bet = Bet.objects.select_for_update().get(pk=bet_id)
    if bet.status != "pending":
        return  # déjà réglé (ex. par une autre jambe perdante)

    legs = list(bet.selections.all())
    statuses = [l.status for l in legs]
    payout = Decimal("0")

    if "lost" in statuses:
        bet.status = "lost"
    elif "pending" in statuses:
        return  # encore des jambes à régler
    else:
        won_legs = [l for l in legs if l.status == "won"]
        if not won_legs:
            # Toutes les jambes annulées : on rembourse la mise.
            payout = bet.stake
            _credit(bet.user_id, payout)
            bet.status = "cancelled"
        else:
            eff_odd = Decimal("1")
            for leg in won_legs:
                eff_odd *= leg.odd_value
            payout = bet.stake * eff_odd
            _credit(bet.user_id, payout)
            bet.status = "won"

    bet.settled_at = now
    bet.save(update_fields=["status", "settled_at"])
    _notify_settled(bet, payout)


def _notify_settled(bet, payout) -> None:
    """Notifie le parieur du résultat de son ticket."""
    if bet.status == "won":
        msg = f"Pari gagné : +{int(payout)} K encaissés ! 🎉"
    elif bet.status == "lost":
        msg = "Pari perdu… la prochaine sera la bonne."
    else:  # cancelled
        msg = f"Pari annulé : {int(payout)} K remboursés."
    notify(bet.user_id, "bet_settled", msg, url="/tickets")


def _credit(user_id: int, amount) -> None:
    """Crédite le wallet d'un utilisateur (mise à jour atomique en base)."""
    from django.contrib.auth import get_user_model

    User = get_user_model()
    User.objects.filter(pk=user_id).update(wallet=F("wallet") + amount)


def settle_finished_matches() -> int:
    """Règle tous les matchs terminés/annulés ayant encore des jambes en attente.

    Renvoie le nombre total de jambes réglées.
    """
    matches = (
        Match.objects
        .filter(status__in=["finished", "cancelled"], bet_selections__status="pending")
        .distinct()
    )

    total = 0
    for match in matches:
        total += settle_match(match)

    if total:
        logger.info("Règlement : %s jambes réglées", total)

    return total
