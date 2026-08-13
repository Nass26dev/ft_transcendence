from datetime import timedelta
from decimal import Decimal

import pytest
from django.urls import reverse
from django.utils import timezone

from betting.models import Bet, BetSelection
from friends.models import Friendship
from sports.models import Competition, Match, Odds, Sport, Team


@pytest.fixture
def competition():
    sport = Sport.objects.create(name="Football", slug="football")
    return Competition.objects.create(sport=sport, name="Ligue 1", slug="ligue-1", season="2025")


@pytest.fixture
def teams(competition):
    home = Team.objects.create(competition=competition, name="Paris SG")
    away = Team.objects.create(competition=competition, name="Marseille")
    return home, away


@pytest.fixture
def match(competition, teams):
    home, away = teams
    return Match.objects.create(
        competition=competition,
        home_team=home,
        away_team=away,
        kickoff_at=timezone.now() + timedelta(days=1),
        status="scheduled",
        external_id="ext-match-1",
    )


@pytest.fixture
def odds(match):
    return {
        "home": Odds.objects.create(match=match, market="1N2", selection="home", value=Decimal("1.80")),
        "draw": Odds.objects.create(match=match, market="1N2", selection="draw", value=Decimal("3.40")),
        "away": Odds.objects.create(match=match, market="1N2", selection="away", value=Decimal("4.10")),
    }


# ── Modèles ──────────────────────────────────────────────────────────

@pytest.mark.django_db
def test_bet_is_combo_false_for_single_leg(user, match, odds):
    bet = Bet.objects.create(user=user, stake=Decimal("10"), odd_value=Decimal("1.80"))
    BetSelection.objects.create(bet=bet, match=match, odd=odds["home"], odd_value=odds["home"].value)
    assert bet.is_combo is False


@pytest.mark.django_db
def test_bet_is_combo_true_for_multiple_legs(user, match, odds, competition):
    home2 = Team.objects.create(competition=competition, name="Lyon")
    away2 = Team.objects.create(competition=competition, name="Lille")
    match2 = Match.objects.create(
        competition=competition, home_team=home2, away_team=away2,
        kickoff_at=timezone.now() + timedelta(days=1), status="scheduled", external_id="ext-match-2",
    )
    odd2 = Odds.objects.create(match=match2, market="1N2", selection="home", value=Decimal("2.00"))

    bet = Bet.objects.create(user=user, stake=Decimal("10"), odd_value=Decimal("3.60"))
    BetSelection.objects.create(bet=bet, match=match, odd=odds["home"], odd_value=odds["home"].value)
    BetSelection.objects.create(bet=bet, match=match2, odd=odd2, odd_value=odd2.value)
    assert bet.is_combo is True


# ── API : création de pari ──────────────────────────────────────────

@pytest.mark.django_db
def test_create_bet_requires_auth(api_client, match):
    resp = api_client.post(reverse("bets-list"), {"match": match.id, "selection": "1", "stake": "10"})
    assert resp.status_code == 401


@pytest.mark.django_db
def test_create_simple_bet_debits_wallet(auth_client, user, match, odds):
    resp = auth_client.post(reverse("bets-list"), {"match": match.id, "selection": "1", "stake": "10"})
    assert resp.status_code == 201, resp.data

    user.refresh_from_db()
    assert user.wallet == Decimal("90.00")
    assert Decimal(resp.data["odd_value"]) == Decimal("1.80")
    assert resp.data["kind"] == "Simple"


@pytest.mark.django_db
def test_create_combo_bet_multiplies_odds(auth_client, user, match, odds, competition):
    home2 = Team.objects.create(competition=competition, name="Lyon")
    away2 = Team.objects.create(competition=competition, name="Lille")
    match2 = Match.objects.create(
        competition=competition, home_team=home2, away_team=away2,
        kickoff_at=timezone.now() + timedelta(days=1), status="scheduled", external_id="ext-match-2",
    )
    Odds.objects.create(match=match2, market="1N2", selection="away", value=Decimal("2.00"))

    payload = {
        "selections": [
            {"match": match.id, "selection": "1"},
            {"match": match2.id, "selection": "2"},
        ],
        "stake": "10",
    }
    resp = auth_client.post(reverse("bets-list"), payload, format="json")
    assert resp.status_code == 201, resp.data
    assert Decimal(resp.data["odd_value"]) == Decimal("3.60")
    assert resp.data["kind"] == "Combiné x2"


@pytest.mark.django_db
def test_create_bet_insufficient_funds(auth_client, user, match, odds):
    resp = auth_client.post(reverse("bets-list"), {"match": match.id, "selection": "1", "stake": "1000"})
    assert resp.status_code == 400
    assert "stake" in resp.data

    user.refresh_from_db()
    assert user.wallet == Decimal("100.00")


@pytest.mark.django_db
def test_create_bet_rejects_non_positive_stake(auth_client, match, odds):
    resp = auth_client.post(reverse("bets-list"), {"match": match.id, "selection": "1", "stake": "0"})
    assert resp.status_code == 400


@pytest.mark.django_db
def test_create_bet_rejects_closed_match(auth_client, match, odds):
    match.status = "finished"
    match.save(update_fields=["status"])
    resp = auth_client.post(reverse("bets-list"), {"match": match.id, "selection": "1", "stake": "10"})
    assert resp.status_code == 400


@pytest.mark.django_db
def test_create_bet_rejects_live_match_past_cutoff(auth_client, match, odds):
    match.status = "live"
    match.current_minute = 90
    match.save(update_fields=["status", "current_minute"])
    resp = auth_client.post(reverse("bets-list"), {"match": match.id, "selection": "1", "stake": "10"})
    assert resp.status_code == 400


@pytest.mark.django_db
def test_create_bet_rejects_duplicate_match_in_combo(auth_client, match, odds):
    payload = {
        "selections": [
            {"match": match.id, "selection": "1"},
            {"match": match.id, "selection": "2"},
        ],
        "stake": "10",
    }
    resp = auth_client.post(reverse("bets-list"), payload, format="json")
    assert resp.status_code == 400


@pytest.mark.django_db
def test_create_bet_missing_odds_for_selection(auth_client, match):
    Odds.objects.create(match=match, market="1N2", selection="home", value=Decimal("1.80"))
    resp = auth_client.post(reverse("bets-list"), {"match": match.id, "selection": "2", "stake": "10"})
    assert resp.status_code == 400


# ── API : liste / isolation ─────────────────────────────────────────

@pytest.mark.django_db
def test_bet_list_only_returns_own_bets(auth_client, user, other_user, match, odds):
    Bet.objects.create(user=user, stake=Decimal("10"), odd_value=Decimal("1.80"))
    Bet.objects.create(user=other_user, stake=Decimal("5"), odd_value=Decimal("2.00"))

    resp = auth_client.get(reverse("bets-list"))
    assert resp.status_code == 200
    assert len(resp.data) == 1


@pytest.mark.django_db
def test_bet_detail_404_for_other_users_bet(auth_client, other_user):
    bet = Bet.objects.create(user=other_user, stake=Decimal("5"), odd_value=Decimal("2.00"))
    resp = auth_client.get(reverse("bets-detail", args=[bet.id]))
    assert resp.status_code == 404


@pytest.mark.django_db
def test_bet_destroy_own_bet(auth_client, user):
    bet = Bet.objects.create(user=user, stake=Decimal("5"), odd_value=Decimal("2.00"))
    resp = auth_client.delete(reverse("bets-detail", args=[bet.id]))
    assert resp.status_code == 204
    assert not Bet.objects.filter(id=bet.id).exists()


# ── Trending ─────────────────────────────────────────────────────────

@pytest.mark.django_db
def test_trending_empty_without_bets(api_client):
    resp = api_client.get(reverse("bets-trending"))
    assert resp.status_code == 200
    assert resp.data == []


@pytest.mark.django_db
def test_trending_counts_selections(api_client, user, other_user, match, odds):
    for u in (user, other_user):
        bet = Bet.objects.create(user=u, stake=Decimal("10"), odd_value=odds["home"].value)
        BetSelection.objects.create(bet=bet, match=match, odd=odds["home"], odd_value=odds["home"].value)

    resp = api_client.get(reverse("bets-trending"))
    assert resp.status_code == 200
    assert resp.data[0]["count"] == 2
    assert resp.data[0]["selection"] == "home"


# ── Leaderboard ──────────────────────────────────────────────────────

@pytest.mark.django_db
def test_leaderboard_computes_net_profit(api_client, user, other_user):
    Bet.objects.create(user=user, stake=Decimal("10"), odd_value=Decimal("2.00"), status="won")
    Bet.objects.create(user=other_user, stake=Decimal("20"), odd_value=Decimal("3.00"), status="lost")

    resp = api_client.get(reverse("leaderboard"), {"period": "all"})
    assert resp.status_code == 200
    entries = {e["user_id"]: e for e in resp.data["entries"]}
    assert entries[user.id]["net"] == 10.0
    assert entries[other_user.id]["net"] == -20.0


@pytest.mark.django_db
def test_leaderboard_ignores_pending_bets(api_client, user):
    Bet.objects.create(user=user, stake=Decimal("10"), odd_value=Decimal("2.00"), status="pending")
    resp = api_client.get(reverse("leaderboard"), {"period": "all"})
    assert resp.data["entries"] == []


@pytest.mark.django_db
def test_leaderboard_friends_scope_empty_when_anonymous(api_client):
    resp = api_client.get(reverse("leaderboard"), {"scope": "friends"})
    assert resp.status_code == 200
    assert resp.data["entries"] == []


@pytest.mark.django_db
def test_leaderboard_friends_scope_excludes_non_friends(auth_client, user, other_user):
    from django.contrib.auth import get_user_model

    User = get_user_model()
    stranger = User.objects.create_user(email="stranger@example.com", username="stranger", password="Testpassword123")

    Friendship.objects.create(sender=user, receiver=other_user, status="accepted")
    Bet.objects.create(user=user, stake=Decimal("10"), odd_value=Decimal("2.00"), status="won")
    Bet.objects.create(user=other_user, stake=Decimal("10"), odd_value=Decimal("2.00"), status="won")
    Bet.objects.create(user=stranger, stake=Decimal("10"), odd_value=Decimal("2.00"), status="won")

    resp = auth_client.get(reverse("leaderboard"), {"scope": "friends", "period": "all"})
    ids = {e["user_id"] for e in resp.data["entries"]}
    assert ids == {user.id, other_user.id}
