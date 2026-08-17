from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from league.models import League, LeagueInvitation

User = get_user_model()


@pytest.fixture
def league(user):
    league = League.objects.create(name="Kop Legends", description="La meilleure ligue", creator=user)
    league.members.add(user)
    return league


# ── Modèle ───────────────────────────────────────────────────────────

@pytest.mark.django_db
def test_league_str(league):
    assert str(league) == "Kop Legends"


@pytest.mark.django_db
def test_league_invitation_unique_per_receiver(league, user, other_user):
    LeagueInvitation.objects.create(league=league, sender=user, receiver=other_user)
    with pytest.raises(Exception):
        LeagueInvitation.objects.create(league=league, sender=user, receiver=other_user)


# ── CreateLeague ─────────────────────────────────────────────────────

@pytest.mark.django_db
def test_create_league_requires_auth(api_client):
    resp = api_client.post("/api/league/create/", {"name": "Nouvelle", "description": "desc"})
    assert resp.status_code == 401


@pytest.mark.django_db
def test_create_league_success(auth_client, user):
    resp = auth_client.post("/api/league/create/", {"name": "Nouvelle", "description": "desc"})
    assert resp.status_code == 201
    league = League.objects.get(name="Nouvelle")
    assert league.creator == user
    assert user in league.members.all()


@pytest.mark.django_db
def test_create_league_missing_fields(auth_client):
    resp = auth_client.post("/api/league/create/", {"name": "Nouvelle"})
    assert resp.status_code == 400


@pytest.mark.django_db
def test_create_league_duplicate_name(auth_client, league):
    resp = auth_client.post("/api/league/create/", {"name": league.name, "description": "desc"})
    assert resp.status_code == 400


# ── LeagueList / AllLeague / LeagueDetail ───────────────────────────

@pytest.mark.django_db
def test_league_list_only_own_leagues(auth_client, league, other_user):
    other_league = League.objects.create(name="Autre ligue", description="d", creator=other_user)
    other_league.members.add(other_user)

    resp = auth_client.get("/api/league/list/")
    assert resp.status_code == 200
    names = [l["name"] for l in resp.data]
    assert league.name in names
    assert other_league.name not in names


@pytest.mark.django_db
def test_all_league_lists_every_league(auth_client, league, other_user):
    other_league = League.objects.create(name="Autre ligue", description="d", creator=other_user)

    resp = auth_client.get("/api/league/all-league/")
    names = [l["name"] for l in resp.data]
    assert league.name in names
    assert other_league.name in names


@pytest.mark.django_db
def test_league_detail_404(auth_client):
    resp = auth_client.get("/api/league/999999/")
    assert resp.status_code == 404


@pytest.mark.django_db
def test_league_detail_success(auth_client, league):
    resp = auth_client.get(f"/api/league/{league.id}/")
    assert resp.status_code == 200
    assert resp.data["name"] == league.name
    assert resp.data["members_count"] == 1


# ── MemberInLeague ───────────────────────────────────────────────────

@pytest.mark.django_db
def test_members_in_league(auth_client, league, user):
    resp = auth_client.get(f"/api/league/{league.id}/members/")
    assert resp.status_code == 200
    assert resp.data[0]["id"] == user.id


@pytest.mark.django_db
def test_members_in_league_404(auth_client):
    resp = auth_client.get("/api/league/999999/members/")
    assert resp.status_code == 404


# ── SendLeagueRequest ────────────────────────────────────────────────

@pytest.mark.django_db
def test_invite_requires_creator(auth_client, other_user, user):
    third = User.objects.create_user(email="third@example.com", username="third", password="Testpassword123")
    other_league = League.objects.create(name="Autre ligue", description="d", creator=other_user)
    resp = auth_client.post("/api/league/invite/", {"receiver_id": third.id, "league_id": other_league.id})
    assert resp.status_code == 403


@pytest.mark.django_db
def test_invite_success(auth_client, league, other_user):
    resp = auth_client.post("/api/league/invite/", {"receiver_id": other_user.id, "league_id": league.id})
    assert resp.status_code == 201
    assert LeagueInvitation.objects.filter(league=league, receiver=other_user).exists()


@pytest.mark.django_db
def test_invite_self_rejected(auth_client, league, user):
    resp = auth_client.post("/api/league/invite/", {"receiver_id": user.id, "league_id": league.id})
    assert resp.status_code == 400


@pytest.mark.django_db
def test_invite_already_member_rejected(auth_client, league, user, other_user):
    league.members.add(other_user)
    resp = auth_client.post("/api/league/invite/", {"receiver_id": other_user.id, "league_id": league.id})
    assert resp.status_code == 400


@pytest.mark.django_db
def test_invite_duplicate_rejected(auth_client, league, other_user, user):
    LeagueInvitation.objects.create(league=league, sender=user, receiver=other_user)
    resp = auth_client.post("/api/league/invite/", {"receiver_id": other_user.id, "league_id": league.id})
    assert resp.status_code == 400


@pytest.mark.django_db
def test_invite_missing_fields(auth_client):
    resp = auth_client.post("/api/league/invite/", {})
    assert resp.status_code == 400


@pytest.mark.django_db
def test_invite_unknown_receiver_404(auth_client, league):
    resp = auth_client.post("/api/league/invite/", {"receiver_id": 999999, "league_id": league.id})
    assert resp.status_code == 404


@pytest.mark.django_db
def test_invite_unknown_league_404(auth_client, other_user):
    resp = auth_client.post("/api/league/invite/", {"receiver_id": other_user.id, "league_id": 999999})
    assert resp.status_code == 404


# ── LeagueInvitationList / Accept / Decline ─────────────────────────

@pytest.mark.django_db
def test_invitation_list_only_mine(auth_client, user, other_user, league):
    third = User.objects.create_user(email="third@example.com", username="third", password="Testpassword123")
    LeagueInvitation.objects.create(league=league, sender=user, receiver=other_user)
    other_league = League.objects.create(name="Bis", description="d", creator=other_user)
    LeagueInvitation.objects.create(league=other_league, sender=other_user, receiver=third)

    resp = auth_client.get("/api/league/invitations/")
    assert resp.status_code == 200
    assert resp.data == []


@pytest.mark.django_db
def test_accept_invitation_adds_member_and_deletes(auth_client, user, other_user, league):
    invite = LeagueInvitation.objects.create(league=league, sender=user, receiver=other_user)

    client = APIClient()
    client.force_authenticate(user=other_user)

    resp = client.post(f"/api/league/invitations/{invite.id}/accept/")
    assert resp.status_code == 200
    assert other_user in league.members.all()
    assert not LeagueInvitation.objects.filter(id=invite.id).exists()


@pytest.mark.django_db
def test_accept_invitation_404_for_wrong_user(auth_client, other_user, league, user):
    invite = LeagueInvitation.objects.create(league=league, sender=user, receiver=other_user)
    resp = auth_client.post(f"/api/league/invitations/{invite.id}/accept/")
    assert resp.status_code == 404


@pytest.mark.django_db
def test_decline_invitation_deletes_without_membership(user, other_user, league):
    invite = LeagueInvitation.objects.create(league=league, sender=user, receiver=other_user)

    client = APIClient()
    client.force_authenticate(user=other_user)

    resp = client.post(f"/api/league/invitations/{invite.id}/decline/")
    assert resp.status_code == 200
    assert other_user not in league.members.all()
    assert not LeagueInvitation.objects.filter(id=invite.id).exists()


# ── LeaveLeague ──────────────────────────────────────────────────────

@pytest.mark.django_db
def test_leave_league_creator_forbidden(auth_client, league):
    resp = auth_client.post(f"/api/league/{league.id}/leave/")
    assert resp.status_code == 400


@pytest.mark.django_db
def test_leave_league_not_member(auth_client, other_user):
    other_league = League.objects.create(name="Autre", description="d", creator=other_user)
    resp = auth_client.post(f"/api/league/{other_league.id}/leave/")
    assert resp.status_code == 400


@pytest.mark.django_db
def test_leave_league_success(league, other_user):
    league.members.add(other_user)
    client = APIClient()
    client.force_authenticate(user=other_user)

    resp = client.post(f"/api/league/{league.id}/leave/")
    assert resp.status_code == 200
    assert other_user not in league.members.all()


# ── KickMember ───────────────────────────────────────────────────────

@pytest.mark.django_db
def test_kick_requires_creator(league, other_user, user):
    league.members.add(other_user)
    third = User.objects.create_user(email="third@example.com", username="third", password="Testpassword123")
    league.members.add(third)

    client = APIClient()
    client.force_authenticate(user=other_user)

    resp = client.post(f"/api/league/{league.id}/kick/{third.id}/")
    assert resp.status_code == 403


@pytest.mark.django_db
def test_kick_success(auth_client, league, other_user):
    league.members.add(other_user)
    resp = auth_client.post(f"/api/league/{league.id}/kick/{other_user.id}/")
    assert resp.status_code == 200
    assert other_user not in league.members.all()


@pytest.mark.django_db
def test_kick_creator_forbidden(auth_client, league, user):
    resp = auth_client.post(f"/api/league/{league.id}/kick/{user.id}/")
    assert resp.status_code == 400


@pytest.mark.django_db
def test_kick_non_member(auth_client, league, other_user):
    resp = auth_client.post(f"/api/league/{league.id}/kick/{other_user.id}/")
    assert resp.status_code == 400


# ── LeagueLeaderboard ────────────────────────────────────────────────

@pytest.mark.django_db
def test_leaderboard_orders_by_wallet_desc(auth_client, league, user, other_user):
    user.wallet = Decimal("50.00")
    user.save(update_fields=["wallet"])
    other_user.wallet = Decimal("500.00")
    other_user.save(update_fields=["wallet"])
    league.members.add(other_user)

    resp = auth_client.get(f"/api/league/{league.id}/leaderboard/")
    assert resp.status_code == 200
    entries = resp.data["entries"]
    assert entries[0]["user_id"] == other_user.id
    assert entries[0]["rank"] == 1
    assert entries[1]["user_id"] == user.id
    assert resp.data["members_count"] == 2


@pytest.mark.django_db
def test_leaderboard_404_unknown_league(auth_client):
    resp = auth_client.get("/api/league/999999/leaderboard/")
    assert resp.status_code == 404


# ── Modification et suppression d'une ligue ──────────────────────────

@pytest.mark.django_db
def test_creator_can_rename_league(auth_client, league):
    resp = auth_client.patch(
        f"/api/league/{league.id}/",
        {"name": "Nouveau nom", "description": "Nouvelle description"},
        format="json",
    )

    assert resp.status_code == 200
    league.refresh_from_db()
    assert league.name == "Nouveau nom"
    assert league.description == "Nouvelle description"


@pytest.mark.django_db
def test_update_is_partial(auth_client, league):
    """Envoyer seulement la description ne doit pas effacer le nom."""
    original = league.name

    resp = auth_client.patch(
        f"/api/league/{league.id}/", {"description": "Juste la description"}, format="json"
    )

    assert resp.status_code == 200
    league.refresh_from_db()
    assert league.name == original


@pytest.mark.django_db
def test_update_rejects_empty_name(auth_client, league):
    resp = auth_client.patch(f"/api/league/{league.id}/", {"name": "   "}, format="json")
    assert resp.status_code == 400


@pytest.mark.django_db
def test_update_rejects_name_already_taken(auth_client, league, other_user):
    League.objects.create(name="Deja pris", creator=other_user)

    resp = auth_client.patch(f"/api/league/{league.id}/", {"name": "Deja pris"}, format="json")

    assert resp.status_code == 400


@pytest.mark.django_db
def test_member_cannot_update_league(api_client, league, other_user):
    league.members.add(other_user)
    api_client.force_authenticate(user=other_user)

    resp = api_client.patch(f"/api/league/{league.id}/", {"name": "Pirate"}, format="json")

    assert resp.status_code == 403


@pytest.mark.django_db
def test_creator_can_delete_league(auth_client, league):
    league_id = league.id

    resp = auth_client.delete(f"/api/league/{league_id}/")

    assert resp.status_code == 200
    assert not League.objects.filter(id=league_id).exists()


@pytest.mark.django_db
def test_member_cannot_delete_league(api_client, league, other_user):
    league.members.add(other_user)
    api_client.force_authenticate(user=other_user)

    resp = api_client.delete(f"/api/league/{league.id}/")

    assert resp.status_code == 403
    assert League.objects.filter(id=league.id).exists()


@pytest.mark.django_db
def test_delete_notifies_other_members(auth_client, league, other_user):
    from notifications.models import Notification

    league.members.add(other_user)

    auth_client.delete(f"/api/league/{league.id}/")

    assert Notification.objects.filter(recipient=other_user, type="league_deleted").exists()


@pytest.mark.django_db
def test_delete_unknown_league_returns_404(auth_client):
    assert auth_client.delete("/api/league/999999/").status_code == 404
