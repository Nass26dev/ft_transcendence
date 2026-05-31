"""Calcul de la progression des défis/badges (à la volée, depuis les paris)
et distribution des récompenses."""

from django.db import transaction
from django.db.models import Max
from django.utils import timezone

from betting.models import Bet
from sports.services.settle import _credit  # crédit atomique du wallet

from .models import Badge, ChallengeClaim, UserBadge


def compute_metric(user, metric: str) -> int:
    """Valeur d'une métrique pour un utilisateur (entier)."""
    bets = Bet.objects.filter(user=user)

    if metric == "bets_total":
        return bets.count()

    if metric == "bets_today":
        return bets.filter(created_at__date=timezone.localdate()).count()

    if metric == "wins_total":
        return bets.filter(status="won").count()

    if metric == "wins_today":
        return bets.filter(status="won", settled_at__date=timezone.localdate()).count()

    if metric == "current_streak":
        streak = 0
        for b in bets.order_by("-created_at").only("status"):
            if b.status in ("pending", "cancelled"):
                continue
            if b.status == "won":
                streak += 1
            else:
                break
        return streak

    if metric == "biggest_win_odd":
        m = bets.filter(status="won").aggregate(x=Max("odd_value"))["x"]
        return int(m) if m else 0

    return 0


def period_key(challenge) -> str:
    """Période courante d'un défi : la date (quotidien) ou 'season'."""
    return timezone.localdate().isoformat() if challenge.kind == "daily" else "season"


def challenge_state(user, challenge) -> dict:
    progress = compute_metric(user, challenge.metric)
    claimed = ChallengeClaim.objects.filter(
        user=user, challenge=challenge, period=period_key(challenge)
    ).exists()
    return {
        "progress": min(progress, challenge.target),
        "target": challenge.target,
        "completed": progress >= challenge.target,
        "claimed": claimed,
    }


def claim_challenge(user, challenge):
    """Réclame la récompense. Renvoie le nouveau solde.

    Lève ValueError('not_completed') ou ValueError('already_claimed').
    """
    if compute_metric(user, challenge.metric) < challenge.target:
        raise ValueError("not_completed")

    period = period_key(challenge)
    with transaction.atomic():
        _, created = ChallengeClaim.objects.get_or_create(
            user=user, challenge=challenge, period=period
        )
        if not created:
            raise ValueError("already_claimed")
        _credit(user.id, challenge.reward)
        user.refresh_from_db(fields=["wallet"])
    return user.wallet


def sync_badges(user) -> list[dict]:
    """Débloque les badges nouvellement atteints et renvoie l'état de tous."""
    existing = {
        ub.badge_id: ub.unlocked_at
        for ub in UserBadge.objects.filter(user=user)
    }

    to_create = [
        UserBadge(user=user, badge=badge)
        for badge in Badge.objects.all()
        if badge.id not in existing
        and compute_metric(user, badge.metric) >= badge.threshold
    ]
    if to_create:
        UserBadge.objects.bulk_create(to_create, ignore_conflicts=True)
        existing = {
            ub.badge_id: ub.unlocked_at
            for ub in UserBadge.objects.filter(user=user)
        }

    return [
        {
            "badge": badge,
            "unlocked": badge.id in existing,
            "unlocked_at": existing.get(badge.id),
        }
        for badge in Badge.objects.all()
    ]
