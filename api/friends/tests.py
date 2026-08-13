from datetime import timedelta
from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone

from betting.models import Bet, BetSelection
from friends.models import Friendship
from sports.models import Competition, Match, Odds, Sport, Team

User = get_user_model()


@pytest.fixture
def match():
    sport = Sport.objects.create(name="Football", slug="football")
    competition = Competition.objects.create(sport=sport, name="Ligue 1", slug="ligue-1", season="2025")
    home = Team.objects.create(competition=competition, name="Paris SG")
    away = Team.objects.create(competition=competition, name="Marseille")
    return Match.objects.create(
        competition=competition, home_team=home, away_team=away,
        kickoff_at=timezone.now() + timedelta(days=1), status="scheduled", external_id="ext-1",
    )


@pytest.fixture
def odd_home(match):
    return Odds.objects.create(match=match, market="1N2", selection="home", value=Decimal("1.80"))


# ── Modèle ───────────────────────────────────────────────────────────

@pytest.mark.django_db
def test_friendship_str(user, other_user):
    f = Friendship.objects.create(sender=user, receiver=other_user)
    assert str(f) == f"{user} -> {other_user} (pending)"


@pytest.mark.django_db
def test_friendship_unique_sender_receiver(user, other_user):
    Friendship.objects.create(sender=user, receiver=other_user)
    with pytest.raises(Exception):
        Friendship.objects.create(sender=user, receiver=other_user)


# ── FriendListView ───────────────────────────────────────────────────

@pytest.mark.django_db
def test_friend_list_requires_auth(api_client):
    resp = api_client.get(reverse("friend-list"))
    assert resp.status_code == 401


@pytest.mark.django_db
def test_friend_list_splits_by_relation(auth_client, user, other_user):
    third = User.objects.create_user(email="third@example.com", username="third", password="Testpassword123")
    fourth = User.objects.create_user(email="fourth@example.com", username="fourth", password="Testpassword123")

    Friendship.objects.create(sender=user, receiver=other_user, status="accepted")
    Friendship.objects.create(sender=third, receiver=user, status="pending")
    Friendship.objects.create(sender=user, receiver=fourth, status="pending")

    resp = auth_client.get(reverse("friend-list"))
    assert resp.status_code == 200
    assert len(resp.data["friends"]) == 1
    assert resp.data["friends"][0]["user"]["id"] == other_user.id
    assert len(resp.data["incoming"]) == 1
    assert resp.data["incoming"][0]["user"]["id"] == third.id
    assert len(resp.data["outgoing"]) == 1
    assert resp.data["outgoing"][0]["user"]["id"] == fourth.id


# ── UserSearchView ────────────────────────────────────────────────────

@pytest.mark.django_db
def test_search_requires_auth(api_client):
    resp = api_client.get(reverse("friend-search"), {"q": "user"})
    assert resp.status_code == 401


@pytest.mark.django_db
def test_search_short_query_returns_empty(auth_client):
    resp = auth_client.get(reverse("friend-search"), {"q": "u"})
    assert resp.status_code == 200
    assert resp.data == []


@pytest.mark.django_db
def test_search_excludes_self(auth_client, user):
    resp = auth_client.get(reverse("friend-search"), {"q": user.username})
    assert all(r["id"] != user.id for r in resp.data)


@pytest.mark.django_db
def test_search_annotates_relationship_status(auth_client, user, other_user):
    Friendship.objects.create(sender=user, receiver=other_user, status="accepted")
    resp = auth_client.get(reverse("friend-search"), {"q": other_user.username})
    assert resp.data[0]["status"] == "friends"


@pytest.mark.django_db
def test_search_none_status_without_relation(auth_client, user, other_user):
    resp = auth_client.get(reverse("friend-search"), {"q": other_user.username})
    assert resp.data[0]["status"] == "none"


# ── SendFriendRequest ─────────────────────────────────────────────────

@pytest.mark.django_db
def test_send_request_requires_auth(api_client, other_user):
    resp = api_client.post(reverse("send-friend-request"), {"receiver_id": other_user.id})
    assert resp.status_code == 401


@pytest.mark.django_db
def test_send_request_404_unknown_receiver(auth_client):
    resp = auth_client.post(reverse("send-friend-request"), {"receiver_id": 999999})
    assert resp.status_code == 404


@pytest.mark.django_db
def test_send_request_400_self(auth_client, user):
    resp = auth_client.post(reverse("send-friend-request"), {"receiver_id": user.id})
    assert resp.status_code == 400


@pytest.mark.django_db
def test_send_request_201_creates_pending(auth_client, user, other_user):
    resp = auth_client.post(reverse("send-friend-request"), {"receiver_id": other_user.id})
    assert resp.status_code == 201
    f = Friendship.objects.get(sender=user, receiver=other_user)
    assert f.status == "pending"


@pytest.mark.django_db
def test_send_request_400_duplicate(auth_client, user, other_user):
    Friendship.objects.create(sender=user, receiver=other_user)
    resp = auth_client.post(reverse("send-friend-request"), {"receiver_id": other_user.id})
    assert resp.status_code == 400


# ── AcceptFriendRequest ────────────────────────────────────────────────

@pytest.mark.django_db
def test_accept_requires_auth(api_client, user, other_user):
    f = Friendship.objects.create(sender=user, receiver=other_user)
    resp = api_client.put(reverse("accept-friend-request", args=[f.id]))
    assert resp.status_code == 401


@pytest.mark.django_db
def test_accept_404_unknown(auth_client):
    resp = auth_client.put(reverse("accept-friend-request", args=[999999]))
    assert resp.status_code == 404


@pytest.mark.django_db
def test_accept_403_not_receiver(auth_client, other_user):
    third = User.objects.create_user(email="third@example.com", username="third", password="Testpassword123")
    f = Friendship.objects.create(sender=other_user, receiver=third)
    resp = auth_client.put(reverse("accept-friend-request", args=[f.id]))
    assert resp.status_code == 403


@pytest.mark.django_db
def test_accept_200_marks_accepted(auth_client, user, other_user):
    f = Friendship.objects.create(sender=other_user, receiver=user)
    resp = auth_client.put(reverse("accept-friend-request", args=[f.id]))
    assert resp.status_code == 200
    f.refresh_from_db()
    assert f.status == "accepted"


@pytest.mark.django_db
def test_accept_400_not_pending(auth_client, user, other_user):
    f = Friendship.objects.create(sender=other_user, receiver=user, status="accepted")
    resp = auth_client.put(reverse("accept-friend-request", args=[f.id]))
    assert resp.status_code == 400


# ── DeclineFriendRequest ────────────────────────────────────────────────

@pytest.mark.django_db
def test_decline_403_not_receiver(auth_client, other_user):
    third = User.objects.create_user(email="third@example.com", username="third", password="Testpassword123")
    f = Friendship.objects.create(sender=other_user, receiver=third)
    resp = auth_client.delete(reverse("decline-friend-request", args=[f.id]))
    assert resp.status_code == 403


@pytest.mark.django_db
def test_decline_200_deletes(auth_client, user, other_user):
    f = Friendship.objects.create(sender=other_user, receiver=user)
    resp = auth_client.delete(reverse("decline-friend-request", args=[f.id]))
    assert resp.status_code == 200
    assert not Friendship.objects.filter(id=f.id).exists()


@pytest.mark.django_db
def test_decline_400_not_pending(auth_client, user, other_user):
    f = Friendship.objects.create(sender=other_user, receiver=user, status="accepted")
    resp = auth_client.delete(reverse("decline-friend-request", args=[f.id]))
    assert resp.status_code == 400


# ── DeleteFriend ──────────────────────────────────────────────────────

@pytest.mark.django_db
def test_delete_friend_403_for_stranger(auth_client, other_user):
    third = User.objects.create_user(email="third@example.com", username="third", password="Testpassword123")
    fourth = User.objects.create_user(email="fourth@example.com", username="fourth", password="Testpassword123")
    f = Friendship.objects.create(sender=third, receiver=fourth, status="accepted")
    resp = auth_client.delete(reverse("delete-friend", args=[f.id]))
    assert resp.status_code == 403


@pytest.mark.django_db
def test_delete_friend_400_not_accepted(auth_client, user, other_user):
    f = Friendship.objects.create(sender=user, receiver=other_user, status="pending")
    resp = auth_client.delete(reverse("delete-friend", args=[f.id]))
    assert resp.status_code == 400


@pytest.mark.django_db
def test_delete_friend_200_as_receiver(auth_client, user, other_user):
    f = Friendship.objects.create(sender=other_user, receiver=user, status="accepted")
    resp = auth_client.delete(reverse("delete-friend", args=[f.id]))
    assert resp.status_code == 200
    assert not Friendship.objects.filter(id=f.id).exists()


# ── FriendsFeedView ───────────────────────────────────────────────────

@pytest.mark.django_db
def test_feed_requires_auth(api_client):
    resp = api_client.get(reverse("friend-feed"))
    assert resp.status_code == 401


@pytest.mark.django_db
def test_feed_empty_without_friends(auth_client):
    resp = auth_client.get(reverse("friend-feed"))
    assert resp.status_code == 200
    assert resp.data == []


@pytest.mark.django_db
def test_feed_includes_accepted_friends_bets(auth_client, user, other_user, match, odd_home):
    Friendship.objects.create(sender=user, receiver=other_user, status="accepted")
    bet = Bet.objects.create(user=other_user, stake=Decimal("10"), odd_value=odd_home.value, status="won")
    BetSelection.objects.create(bet=bet, match=match, odd=odd_home, odd_value=odd_home.value)

    resp = auth_client.get(reverse("friend-feed"))
    assert resp.status_code == 200
    assert len(resp.data) == 1
    assert resp.data[0]["user"] == other_user.username
    assert resp.data[0]["kind"] == "won"


@pytest.mark.django_db
def test_feed_excludes_cancelled_bets(auth_client, user, other_user, match, odd_home):
    Friendship.objects.create(sender=user, receiver=other_user, status="accepted")
    bet = Bet.objects.create(user=other_user, stake=Decimal("10"), odd_value=odd_home.value, status="cancelled")
    BetSelection.objects.create(bet=bet, match=match, odd=odd_home, odd_value=odd_home.value)

    resp = auth_client.get(reverse("friend-feed"))
    assert resp.data == []


@pytest.mark.django_db
def test_feed_excludes_private_profiles(auth_client, user, other_user, match, odd_home):
    other_user.is_public = False
    other_user.save(update_fields=["is_public"])
    Friendship.objects.create(sender=user, receiver=other_user, status="accepted")
    bet = Bet.objects.create(user=other_user, stake=Decimal("10"), odd_value=odd_home.value, status="pending")
    BetSelection.objects.create(bet=bet, match=match, odd=odd_home, odd_value=odd_home.value)

    resp = auth_client.get(reverse("friend-feed"))
    assert resp.data == []


@pytest.mark.django_db
def test_feed_excludes_non_accepted_friends(auth_client, user, other_user, match, odd_home):
    Friendship.objects.create(sender=user, receiver=other_user, status="pending")
    bet = Bet.objects.create(user=other_user, stake=Decimal("10"), odd_value=odd_home.value, status="pending")
    BetSelection.objects.create(bet=bet, match=match, odd=odd_home, odd_value=odd_home.value)

    resp = auth_client.get(reverse("friend-feed"))
    assert resp.data == []
