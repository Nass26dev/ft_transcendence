from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient

from betting.models import Bet
from friends.models import Friendship

User = get_user_model()


@pytest.fixture
def admin_user():
    return User.objects.create_user(
        email="admin@example.com", username="admin1", password="Testpassword123", status="admin"
    )


@pytest.fixture
def owner_user():
    return User.objects.create_user(
        email="owner@example.com", username="owner1", password="Testpassword123", status="owner"
    )


@pytest.fixture
def admin_client(admin_user):
    client = APIClient()
    client.force_authenticate(user=admin_user)
    return client


@pytest.fixture
def owner_client(owner_user):
    client = APIClient()
    client.force_authenticate(user=owner_user)
    return client


# ── Permission IsAdminOrOwner ─────────────────────────────────────────

@pytest.mark.django_db
def test_admin_endpoint_requires_auth(api_client):
    resp = api_client.get(reverse("admin-stats"))
    assert resp.status_code == 401


@pytest.mark.django_db
def test_admin_endpoint_forbidden_for_plain_user(auth_client):
    resp = auth_client.get(reverse("admin-stats"))
    assert resp.status_code == 403


@pytest.mark.django_db
def test_admin_endpoint_allowed_for_admin(admin_client):
    resp = admin_client.get(reverse("admin-stats"))
    assert resp.status_code == 200


@pytest.mark.django_db
def test_admin_endpoint_allowed_for_owner(owner_client):
    resp = owner_client.get(reverse("admin-stats"))
    assert resp.status_code == 200


# ── AdminUserSearchView ────────────────────────────────────────────────

@pytest.mark.django_db
def test_search_excludes_self(admin_client, admin_user):
    resp = admin_client.get(reverse("admin-user-search"))
    ids = [u["id"] for u in resp.data]
    assert admin_user.id not in ids


@pytest.mark.django_db
def test_search_filters_by_query(admin_client, user, other_user):
    resp = admin_client.get(reverse("admin-user-search"), {"q": user.username})
    ids = [u["id"] for u in resp.data]
    assert user.id in ids
    assert other_user.id not in ids


# ── AdminStatsView ───────────────────────────────────────────────────

@pytest.mark.django_db
def test_stats_counts_users_by_role(admin_client, admin_user, owner_user, user):
    resp = admin_client.get(reverse("admin-stats"))
    assert resp.status_code == 200
    assert resp.data["admins"] >= 1
    assert resp.data["owners"] >= 1
    assert resp.data["users"] >= 1
    assert resp.data["total_users"] == User.objects.count()


@pytest.mark.django_db
def test_stats_sums_wallet_and_bets(admin_client, user):
    Bet.objects.create(user=user, stake=Decimal("10"), odd_value=Decimal("2.00"), status="pending")
    Bet.objects.create(user=user, stake=Decimal("10"), odd_value=Decimal("2.00"), status="won")

    resp = admin_client.get(reverse("admin-stats"))
    assert resp.data["total_bets"] >= 2
    assert resp.data["pending_bets"] >= 1
    assert resp.data["won_bets"] >= 1


# ── AdminUserDetailView ──────────────────────────────────────────────

@pytest.mark.django_db
def test_user_detail_404(admin_client):
    resp = admin_client.get(reverse("admin-user-detail", args=[999999]))
    assert resp.status_code == 404


@pytest.mark.django_db
def test_user_detail_includes_friends_and_bets(admin_client, user, other_user):
    Friendship.objects.create(sender=user, receiver=other_user, status="accepted")
    Bet.objects.create(user=user, stake=Decimal("10"), odd_value=Decimal("2.00"))

    resp = admin_client.get(reverse("admin-user-detail", args=[user.id]))
    assert resp.status_code == 200
    assert len(resp.data["friends"]) == 1
    assert len(resp.data["bets"]) == 1


@pytest.mark.django_db
def test_admin_cannot_modify_owner(admin_client, owner_user):
    resp = admin_client.patch(reverse("admin-user-detail", args=[owner_user.id]), {"bio": "x"}, format="json")
    assert resp.status_code == 403


@pytest.mark.django_db
def test_owner_can_modify_owner(owner_client, owner_user):
    resp = owner_client.patch(reverse("admin-user-detail", args=[owner_user.id]), {"bio": "updated"}, format="json")
    assert resp.status_code == 200
    owner_user.refresh_from_db()
    assert owner_user.bio == "updated"


@pytest.mark.django_db
def test_admin_cannot_change_role(admin_client, user):
    resp = admin_client.patch(reverse("admin-user-detail", args=[user.id]), {"status": "admin"}, format="json")
    assert resp.status_code == 403


@pytest.mark.django_db
def test_owner_can_change_role(owner_client, user):
    resp = owner_client.patch(reverse("admin-user-detail", args=[user.id]), {"status": "admin"}, format="json")
    assert resp.status_code == 200
    user.refresh_from_db()
    assert user.status == "admin"


@pytest.mark.django_db
def test_admin_can_edit_non_role_fields(admin_client, user):
    resp = admin_client.patch(reverse("admin-user-detail", args=[user.id]), {"bio": "nouvelle bio"}, format="json")
    assert resp.status_code == 200
    user.refresh_from_db()
    assert user.bio == "nouvelle bio"


@pytest.mark.django_db
def test_update_rejects_duplicate_email(admin_client, user, other_user):
    resp = admin_client.patch(reverse("admin-user-detail", args=[user.id]), {"email": other_user.email}, format="json")
    assert resp.status_code == 400


@pytest.mark.django_db
def test_update_404_unknown_user(admin_client):
    resp = admin_client.patch(reverse("admin-user-detail", args=[999999]), {"bio": "x"}, format="json")
    assert resp.status_code == 404


# ── AdminUserWalletView ──────────────────────────────────────────────

@pytest.mark.django_db
def test_wallet_update_success(admin_client, user):
    resp = admin_client.patch(reverse("admin-user-wallet", args=[user.id]), {"wallet": "500.00"}, format="json")
    assert resp.status_code == 200
    user.refresh_from_db()
    assert user.wallet == Decimal("500.00")


@pytest.mark.django_db
def test_wallet_update_rejects_negative(admin_client, user):
    resp = admin_client.patch(reverse("admin-user-wallet", args=[user.id]), {"wallet": "-10"}, format="json")
    assert resp.status_code == 400


@pytest.mark.django_db
def test_wallet_update_404_unknown_user(admin_client):
    resp = admin_client.patch(reverse("admin-user-wallet", args=[999999]), {"wallet": "10"}, format="json")
    assert resp.status_code == 404


# ── AdminUserFriendRemoveView ─────────────────────────────────────────

@pytest.mark.django_db
def test_friend_remove_success_either_direction(admin_client, user, other_user):
    Friendship.objects.create(sender=other_user, receiver=user, status="accepted")
    resp = admin_client.delete(reverse("admin-user-friend-remove", args=[user.id, other_user.id]))
    assert resp.status_code == 204
    assert not Friendship.objects.filter(sender=other_user, receiver=user).exists()


@pytest.mark.django_db
def test_friend_remove_404_when_no_relation(admin_client, user, other_user):
    resp = admin_client.delete(reverse("admin-user-friend-remove", args=[user.id, other_user.id]))
    assert resp.status_code == 404
