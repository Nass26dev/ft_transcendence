from decimal import Decimal

import pytest
from django.urls import reverse
from django.utils import timezone

from betting.models import Bet
from challenges import services
from challenges.models import Badge, Challenge, ChallengeClaim, UserBadge


@pytest.fixture
def daily_challenge():
    return Challenge.objects.create(
        code="daily-bets", kind="daily", title="3 paris aujourd'hui",
        metric="bets_today", target=3, reward=50, active=True,
    )


@pytest.fixture
def season_challenge():
    return Challenge.objects.create(
        code="season-wins", kind="season", title="10 victoires",
        metric="wins_total", target=10, reward=200, active=True,
    )


@pytest.fixture
def badge():
    return Badge.objects.create(
        code="first-win", name="Première victoire", metric="wins_total", threshold=1,
    )


def _make_bet(user, status="pending", odd_value=Decimal("2.00")):
    return Bet.objects.create(user=user, stake=Decimal("10"), odd_value=odd_value, status=status)


# ── services.compute_metric ─────────────────────────────────────────

@pytest.mark.django_db
def test_compute_metric_bets_total(user):
    _make_bet(user)
    _make_bet(user)
    assert services.compute_metric(user, "bets_total") == 2


@pytest.mark.django_db
def test_compute_metric_bets_today(user):
    _make_bet(user)
    assert services.compute_metric(user, "bets_today") == 1


@pytest.mark.django_db
def test_compute_metric_wins_total(user):
    _make_bet(user, status="won")
    _make_bet(user, status="lost")
    assert services.compute_metric(user, "wins_total") == 1


@pytest.mark.django_db
def test_compute_metric_wins_today(user):
    bet = _make_bet(user, status="won")
    bet.settled_at = timezone.now()
    bet.save(update_fields=["settled_at"])
    assert services.compute_metric(user, "wins_today") == 1


@pytest.mark.django_db
def test_compute_metric_current_streak_stops_at_first_loss(user):
    _make_bet(user, status="lost")
    _make_bet(user, status="won")
    _make_bet(user, status="won")
    assert services.compute_metric(user, "current_streak") == 2


@pytest.mark.django_db
def test_compute_metric_current_streak_skips_pending(user):
    _make_bet(user, status="won")
    _make_bet(user, status="pending")
    assert services.compute_metric(user, "current_streak") == 1


@pytest.mark.django_db
def test_compute_metric_biggest_win_odd(user):
    _make_bet(user, status="won", odd_value=Decimal("2.00"))
    _make_bet(user, status="won", odd_value=Decimal("5.00"))
    assert services.compute_metric(user, "biggest_win_odd") == 5


@pytest.mark.django_db
def test_compute_metric_unknown_returns_zero(user):
    assert services.compute_metric(user, "does_not_exist") == 0


@pytest.mark.django_db
def test_period_key_daily(daily_challenge):
    assert services.period_key(daily_challenge) == timezone.localdate().isoformat()


@pytest.mark.django_db
def test_period_key_season(season_challenge):
    assert services.period_key(season_challenge) == "season"


# ── services.challenge_state / claim_challenge ──────────────────────

@pytest.mark.django_db
def test_challenge_state_progress_capped_at_target(user, daily_challenge):
    for _ in range(5):
        _make_bet(user)
    state = services.challenge_state(user, daily_challenge)
    assert state["progress"] == daily_challenge.target
    assert state["completed"] is True
    assert state["claimed"] is False


@pytest.mark.django_db
def test_claim_challenge_credits_wallet(user, daily_challenge):
    for _ in range(3):
        _make_bet(user)
    wallet = services.claim_challenge(user, daily_challenge)
    assert wallet == Decimal("150.00")
    assert ChallengeClaim.objects.filter(user=user, challenge=daily_challenge).exists()


@pytest.mark.django_db
def test_claim_challenge_not_completed_raises(user, daily_challenge):
    with pytest.raises(ValueError, match="not_completed"):
        services.claim_challenge(user, daily_challenge)


@pytest.mark.django_db
def test_claim_challenge_already_claimed_raises(user, daily_challenge):
    for _ in range(3):
        _make_bet(user)
    services.claim_challenge(user, daily_challenge)
    with pytest.raises(ValueError, match="already_claimed"):
        services.claim_challenge(user, daily_challenge)


@pytest.mark.django_db
def test_sync_badges_unlocks_when_threshold_met(user, badge):
    _make_bet(user, status="won")
    result = services.sync_badges(user)
    mine = next(r for r in result if r["badge"].id == badge.id)
    assert mine["unlocked"] is True
    assert UserBadge.objects.filter(user=user, badge=badge).exists()


@pytest.mark.django_db
def test_sync_badges_does_not_duplicate(user, badge):
    _make_bet(user, status="won")
    services.sync_badges(user)
    services.sync_badges(user)
    assert UserBadge.objects.filter(user=user, badge=badge).count() == 1


@pytest.mark.django_db
def test_sync_badges_locked_without_threshold(user, badge):
    result = services.sync_badges(user)
    mine = next(r for r in result if r["badge"].id == badge.id)
    assert mine["unlocked"] is False


# ── API : ChallengeListView ─────────────────────────────────────────

@pytest.mark.django_db
def test_challenge_list_requires_auth(api_client):
    resp = api_client.get(reverse("challenge-list"))
    assert resp.status_code == 401


@pytest.mark.django_db
def test_challenge_list_splits_by_kind(auth_client, daily_challenge, season_challenge):
    """Le endpoint liste aussi les défis semés par la migration de données
    (0002_seed_definitions) : on vérifie la présence des nôtres, pas l'exclusivité.
    """
    resp = auth_client.get(reverse("challenge-list"))
    assert resp.status_code == 200
    daily_codes = [c["code"] for c in resp.data["daily"]]
    season_codes = [c["code"] for c in resp.data["season"]]
    assert daily_challenge.code in daily_codes
    assert season_challenge.code in season_codes
    assert daily_challenge.code not in season_codes


@pytest.mark.django_db
def test_challenge_list_excludes_inactive(auth_client, daily_challenge):
    daily_challenge.active = False
    daily_challenge.save(update_fields=["active"])
    resp = auth_client.get(reverse("challenge-list"))
    daily_codes = [c["code"] for c in resp.data["daily"]]
    assert daily_challenge.code not in daily_codes


# ── API : ChallengeClaimView ─────────────────────────────────────────

@pytest.mark.django_db
def test_claim_view_404_unknown_code(auth_client):
    resp = auth_client.post(reverse("challenge-claim", args=["nope"]))
    assert resp.status_code == 404


@pytest.mark.django_db
def test_claim_view_400_not_completed(auth_client, daily_challenge):
    resp = auth_client.post(reverse("challenge-claim", args=[daily_challenge.code]))
    assert resp.status_code == 400
    assert resp.data["error"] == "Défi non terminé."


@pytest.mark.django_db
def test_claim_view_success_then_already_claimed(auth_client, user, daily_challenge):
    for _ in range(3):
        _make_bet(user)

    resp = auth_client.post(reverse("challenge-claim", args=[daily_challenge.code]))
    assert resp.status_code == 200
    assert Decimal(resp.data["wallet"]) == Decimal("150.00")

    resp2 = auth_client.post(reverse("challenge-claim", args=[daily_challenge.code]))
    assert resp2.status_code == 400
    assert resp2.data["error"] == "Récompense déjà récupérée."


# ── API : BadgeListView ──────────────────────────────────────────────

@pytest.mark.django_db
def test_badge_list_requires_auth(api_client):
    resp = api_client.get(reverse("badge-list"))
    assert resp.status_code == 401


@pytest.mark.django_db
def test_badge_list_reports_unlock_state(auth_client, user, badge):
    _make_bet(user, status="won")
    resp = auth_client.get(reverse("badge-list"))
    assert resp.status_code == 200
    mine = next(b for b in resp.data if b["code"] == badge.code)
    assert mine["unlocked"] is True
