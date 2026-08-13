from datetime import timedelta
from decimal import Decimal

import pytest
from django.urls import reverse
from django.utils import timezone

from betting.models import Bet, BetSelection
from sports.models import Competition, Match, MatchEvent, MatchLineup, Odds, Sport, Team


@pytest.fixture
def sport():
    return Sport.objects.create(name="Football", slug="football")


@pytest.fixture
def competition(sport):
    return Competition.objects.create(
        sport=sport, name="Ligue 1", slug="ligue-1", season="2025", country="France"
    )


@pytest.fixture
def teams(competition):
    home = Team.objects.create(competition=competition, name="Paris SG")
    away = Team.objects.create(competition=competition, name="Marseille")
    return home, away


@pytest.fixture
def scheduled_match(competition, teams):
    home, away = teams
    return Match.objects.create(
        competition=competition,
        home_team=home,
        away_team=away,
        kickoff_at=timezone.now() + timedelta(days=1),
        status="scheduled",
        external_id="ext-scheduled-1",
    )


@pytest.fixture
def live_match(competition, teams):
    home, away = teams
    return Match.objects.create(
        competition=competition,
        home_team=home,
        away_team=away,
        kickoff_at=timezone.now() - timedelta(minutes=30),
        status="live",
        current_minute=30,
        external_id="ext-live-1",
    )


# ── Modèles ──────────────────────────────────────────────────────────

@pytest.mark.django_db
def test_sport_str(sport):
    assert str(sport) == "Football"


@pytest.mark.django_db
def test_competition_str(competition):
    assert str(competition) == "Ligue 1 (2025)"


@pytest.mark.django_db
def test_competition_unique_slug_per_season(sport, competition):
    with pytest.raises(Exception):
        Competition.objects.create(
            sport=sport, name="Ligue 1 bis", slug="ligue-1", season="2025"
        )


@pytest.mark.django_db
def test_team_unique_per_competition(competition, teams):
    with pytest.raises(Exception):
        Team.objects.create(competition=competition, name="Paris SG")


@pytest.mark.django_db
def test_match_str_contains_teams(scheduled_match):
    text = str(scheduled_match)
    assert "Paris SG" in text and "Marseille" in text


@pytest.mark.django_db
def test_odds_unique_per_match_market_selection(scheduled_match):
    Odds.objects.create(match=scheduled_match, market="1N2", selection="home", value=Decimal("1.50"))
    with pytest.raises(Exception):
        Odds.objects.create(match=scheduled_match, market="1N2", selection="home", value=Decimal("2.00"))


# ── API : liste et détail ───────────────────────────────────────────

@pytest.mark.django_db
def test_match_list_ok(api_client, scheduled_match):
    resp = api_client.get(reverse("sports:match-list"))
    assert resp.status_code == 200
    assert len(resp.data) == 1
    assert resp.data[0]["id"] == scheduled_match.id


@pytest.mark.django_db
def test_match_list_is_public(api_client, scheduled_match):
    """Endpoint sans cadenas : accessible sans authentification."""
    resp = api_client.get(reverse("sports:match-list"))
    assert resp.status_code == 200


@pytest.mark.django_db
def test_match_list_filter_by_status(api_client, scheduled_match, live_match):
    resp = api_client.get(reverse("sports:match-list"), {"status": "live"})
    ids = [m["id"] for m in resp.data]
    assert live_match.id in ids
    assert scheduled_match.id not in ids


@pytest.mark.django_db
def test_match_list_filter_by_competition(api_client, scheduled_match, sport):
    other_comp = Competition.objects.create(sport=sport, name="Liga", slug="liga", season="2025")
    other_home = Team.objects.create(competition=other_comp, name="Real Madrid")
    other_away = Team.objects.create(competition=other_comp, name="Barcelone")
    other_match = Match.objects.create(
        competition=other_comp,
        home_team=other_home,
        away_team=other_away,
        kickoff_at=timezone.now() + timedelta(days=1),
        status="scheduled",
        external_id="ext-liga-1",
    )

    resp = api_client.get(reverse("sports:match-list"), {"competition": "liga"})
    ids = [m["id"] for m in resp.data]
    assert other_match.id in ids
    assert scheduled_match.id not in ids


@pytest.mark.django_db
def test_match_detail_includes_events_and_lineups(api_client, scheduled_match):
    MatchEvent.objects.create(
        match=scheduled_match, minute=10, type="goal", team_side="home", player="Mbappé"
    )
    MatchLineup.objects.create(
        match=scheduled_match, team_side="home", role="starter", number=7, player="Mbappé"
    )

    resp = api_client.get(reverse("sports:match-detail", args=[scheduled_match.id]))
    assert resp.status_code == 200
    assert len(resp.data["events"]) == 1
    assert len(resp.data["lineups"]) == 1


@pytest.mark.django_db
def test_match_detail_404_when_missing(api_client):
    resp = api_client.get(reverse("sports:match-detail", args=[999999]))
    assert resp.status_code == 404


# ── API : upcoming / live ───────────────────────────────────────────

@pytest.mark.django_db
def test_upcoming_excludes_live_and_far_future(api_client, scheduled_match, live_match, competition, teams):
    home, away = teams
    far_future = Match.objects.create(
        competition=competition,
        home_team=home,
        away_team=away,
        kickoff_at=timezone.now() + timedelta(days=30),
        status="scheduled",
        external_id="ext-far-future",
    )

    resp = api_client.get(reverse("sports:match-upcoming"))
    ids = [m["id"] for m in resp.data]
    assert scheduled_match.id in ids
    assert live_match.id not in ids
    assert far_future.id not in ids


@pytest.mark.django_db
def test_live_excludes_scheduled_and_stale_live(api_client, scheduled_match, live_match, competition, teams):
    home, away = teams
    stale_live = Match.objects.create(
        competition=competition,
        home_team=home,
        away_team=away,
        kickoff_at=timezone.now() - timedelta(hours=10),
        status="live",
        external_id="ext-stale-live",
    )

    resp = api_client.get(reverse("sports:match-live"))
    ids = [m["id"] for m in resp.data]
    assert live_match.id in ids
    assert scheduled_match.id not in ids
    assert stale_live.id not in ids


# ── API : odds ───────────────────────────────────────────────────────

@pytest.mark.django_db
def test_odds_endpoint_lists_odds(api_client, scheduled_match):
    Odds.objects.create(match=scheduled_match, market="1N2", selection="home", value=Decimal("1.80"))
    Odds.objects.create(match=scheduled_match, market="1N2", selection="draw", value=Decimal("3.40"))

    resp = api_client.get(reverse("sports:match-odds", args=[scheduled_match.id]))
    assert resp.status_code == 200
    assert len(resp.data) == 2


@pytest.mark.django_db
def test_match_list_serializes_1n2_odds(api_client, scheduled_match):
    Odds.objects.create(match=scheduled_match, market="1N2", selection="home", value=Decimal("1.80"))
    Odds.objects.create(match=scheduled_match, market="1N2", selection="draw", value=Decimal("3.40"))
    Odds.objects.create(match=scheduled_match, market="1N2", selection="away", value=Decimal("4.10"))

    resp = api_client.get(reverse("sports:match-list"))
    odds = resp.data[0]["odds"]
    assert odds == {"1": 1.8, "X": 3.4, "2": 4.1}


# ── Sérialiseur : « Confiance des Kopistes » ────────────────────────

def _place_bet(user, match, odd, selection_status="pending"):
    bet = Bet.objects.create(user=user, stake=Decimal("10.00"), odd_value=odd.value)
    return BetSelection.objects.create(
        bet=bet, match=match, odd=odd, odd_value=odd.value, status=selection_status
    )


@pytest.mark.django_db
def test_conf_and_bets_total_reflect_selections(api_client, scheduled_match, user, other_user):
    odd_home = Odds.objects.create(match=scheduled_match, market="1N2", selection="home", value=Decimal("1.80"))
    odd_away = Odds.objects.create(match=scheduled_match, market="1N2", selection="away", value=Decimal("4.10"))

    _place_bet(user, scheduled_match, odd_home)
    _place_bet(other_user, scheduled_match, odd_home)
    _place_bet(other_user, scheduled_match, odd_away)

    resp = api_client.get(reverse("sports:match-list"))
    data = resp.data[0]
    assert data["bets_total"] == 3
    assert data["conf"] == {"1": 67, "X": 0, "2": 33}
    assert sum(data["conf"].values()) == 100


@pytest.mark.django_db
def test_conf_is_zero_without_bets(api_client, scheduled_match):
    resp = api_client.get(reverse("sports:match-list"))
    data = resp.data[0]
    assert data["bets_total"] == 0
    assert data["conf"] == {"1": 0, "X": 0, "2": 0}
