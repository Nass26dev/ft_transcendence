from decimal import Decimal
from unittest.mock import patch

import pytest
from django.core.cache import cache
from django.test import RequestFactory
from django.urls import reverse
from django.utils import timezone
from rest_framework_simplejwt.tokens import AccessToken

from users.authentication import CookieJWTAuthentication
from users.models import MAX_WALLET
from users.wheel import WHEEL_SEGMENTS, public_segments, spin


# ── LoginStep1View ───────────────────────────────────────────────────

@pytest.mark.django_db
def test_login_step1_success_sends_otp(api_client, user):
    with patch("users.views.send_2fa_email", return_value=True) as mock_send:
        resp = api_client.post(reverse("login-step1"), {"email": user.email, "password": "Testpassword123"})
    assert resp.status_code == 200
    assert resp.data["2fa_required"] is True
    assert resp.data["user_id"] == user.id
    assert cache.get(f"otp_{user.id}") is not None
    mock_send.assert_called_once()


@pytest.mark.django_db
def test_login_step1_invalid_credentials(api_client, user):
    resp = api_client.post(reverse("login-step1"), {"email": user.email, "password": "wrong"})
    assert resp.status_code == 401


@pytest.mark.django_db
def test_login_step1_email_failure_returns_500(api_client, user):
    with patch("users.views.send_2fa_email", return_value=False):
        resp = api_client.post(reverse("login-step1"), {"email": user.email, "password": "Testpassword123"})
    assert resp.status_code == 500


# ── LoginStep2View ───────────────────────────────────────────────────

@pytest.mark.django_db
def test_login_step2_valid_code_sets_cookies(api_client, user):
    cache.set(f"otp_{user.id}", "123456", timeout=300)
    resp = api_client.post(reverse("login-step2"), {"user_id": user.id, "code": "123456"})
    assert resp.status_code == 200
    assert "access_token" in resp.cookies
    assert "refresh_token" in resp.cookies
    assert cache.get(f"otp_{user.id}") is None


@pytest.mark.django_db
def test_login_step2_wrong_code_rejected(api_client, user):
    cache.set(f"otp_{user.id}", "123456", timeout=300)
    resp = api_client.post(reverse("login-step2"), {"user_id": user.id, "code": "000000"})
    assert resp.status_code == 400
    assert "access_token" not in resp.cookies or not resp.cookies["access_token"].value


# ── ProfileView ──────────────────────────────────────────────────────

@pytest.mark.django_db
def test_profile_get_requires_auth(api_client):
    resp = api_client.get(reverse("profile"))
    assert resp.status_code == 401


@pytest.mark.django_db
def test_profile_get_returns_own_data(auth_client, user):
    resp = auth_client.get(reverse("profile"))
    assert resp.status_code == 200
    assert resp.data["email"] == user.email


@pytest.mark.django_db
def test_profile_patch_updates_text_fields(auth_client, user):
    resp = auth_client.patch(reverse("profile"), {"bio": "Nouvelle bio"}, format="json")
    assert resp.status_code == 200
    user.refresh_from_db()
    assert user.bio == "Nouvelle bio"


@pytest.mark.django_db
def test_profile_patch_rejects_duplicate_username(auth_client, user, other_user):
    resp = auth_client.patch(reverse("profile"), {"username": other_user.username}, format="json")
    assert resp.status_code == 400


@pytest.mark.django_db
def test_profile_patch_avatar_rejects_non_image(auth_client):
    from django.core.files.uploadedfile import SimpleUploadedFile

    fake = SimpleUploadedFile("doc.pdf", b"not-an-image", content_type="application/pdf")
    resp = auth_client.patch(reverse("profile"), {"avatar": fake}, format="multipart")
    assert resp.status_code == 400


@pytest.mark.django_db
def test_profile_patch_avatar_rejects_too_large(auth_client):
    from django.core.files.uploadedfile import SimpleUploadedFile

    big = SimpleUploadedFile("big.png", b"x" * (5 * 1024 * 1024 + 1), content_type="image/png")
    resp = auth_client.patch(reverse("profile"), {"avatar": big}, format="multipart")
    assert resp.status_code == 400


@pytest.mark.django_db
def test_profile_patch_avatar_accepts_valid_image(auth_client, user):
    from django.core.files.uploadedfile import SimpleUploadedFile

    small = SimpleUploadedFile("avatar.png", b"fake-bytes", content_type="image/png")
    resp = auth_client.patch(reverse("profile"), {"avatar": small}, format="multipart")
    assert resp.status_code == 200
    user.refresh_from_db()
    assert user.avatar.name


# ── DailyBonusView ───────────────────────────────────────────────────

@pytest.mark.django_db
def test_daily_bonus_requires_auth(api_client):
    resp = api_client.post(reverse("daily-bonus"))
    assert resp.status_code == 401


@pytest.mark.django_db
def test_daily_bonus_credits_wallet_once(auth_client, user):
    resp = auth_client.post(reverse("daily-bonus"))
    assert resp.status_code == 200
    user.refresh_from_db()
    assert user.wallet == Decimal("600.00")
    assert user.last_daily_bonus == timezone.localdate()


@pytest.mark.django_db
def test_daily_bonus_rejected_when_already_claimed(auth_client, user):
    auth_client.post(reverse("daily-bonus"))
    resp = auth_client.post(reverse("daily-bonus"))
    assert resp.status_code == 400


# ── WheelView / WheelSpinView ────────────────────────────────────────

def test_public_segments_hides_weights():
    segments = public_segments()
    assert all("weight" not in s for s in segments)
    assert len(segments) == len(WHEEL_SEGMENTS)


def test_weights_sum_to_100():
    assert sum(s["weight"] for s in WHEEL_SEGMENTS) == 100


def test_spin_returns_valid_index_and_segment():
    index, segment = spin()
    assert 0 <= index < len(WHEEL_SEGMENTS)
    assert segment == WHEEL_SEGMENTS[index]


@pytest.mark.django_db
def test_wheel_view_requires_auth(api_client):
    resp = api_client.get(reverse("wheel"))
    assert resp.status_code == 401


@pytest.mark.django_db
def test_wheel_view_available_by_default(auth_client):
    resp = auth_client.get(reverse("wheel"))
    assert resp.status_code == 200
    assert resp.data["available"] is True
    assert len(resp.data["segments"]) == len(WHEEL_SEGMENTS)


@pytest.mark.django_db
def test_wheel_spin_requires_auth(api_client):
    resp = api_client.post(reverse("wheel-spin"))
    assert resp.status_code == 401


@pytest.mark.django_db
def test_wheel_spin_applies_delta_and_locks_for_the_day(auth_client, user):
    win_segment = {"label": "+100", "amount": 100, "weight": 16, "kind": "win"}
    with patch("users.wheel.spin", return_value=(10, win_segment)):
        resp = auth_client.post(reverse("wheel-spin"))
    assert resp.status_code == 200
    user.refresh_from_db()
    assert user.wallet == Decimal("200.00")
    assert user.last_wheel_spin == timezone.localdate()

    resp2 = auth_client.post(reverse("wheel-spin"))
    assert resp2.status_code == 400


@pytest.mark.django_db
def test_wheel_spin_wallet_floored_at_zero(auth_client, user):
    user.wallet = Decimal("50.00")
    user.save(update_fields=["wallet"])
    loss_segment = {"label": "−1000", "amount": -1000, "weight": 2, "kind": "loss"}
    with patch("users.wheel.spin", return_value=(9, loss_segment)):
        resp = auth_client.post(reverse("wheel-spin"))
    assert resp.status_code == 200
    user.refresh_from_db()
    assert user.wallet == Decimal("0.00")


@pytest.mark.django_db
def test_wheel_spin_wallet_capped_at_max(auth_client, user):
    user.wallet = MAX_WALLET - Decimal("10.00")
    user.save(update_fields=["wallet"])
    jackpot = {"label": "JACKPOT", "amount": 10000, "weight": 1, "kind": "jackpot"}
    with patch("users.wheel.spin", return_value=(0, jackpot)):
        resp = auth_client.post(reverse("wheel-spin"))
    assert resp.status_code == 200
    user.refresh_from_db()
    assert user.wallet == MAX_WALLET


# ── OnboardingCompleteView ───────────────────────────────────────────

@pytest.mark.django_db
def test_onboarding_complete_requires_auth(api_client):
    resp = api_client.post(reverse("onboarding-complete"))
    assert resp.status_code == 401


@pytest.mark.django_db
def test_onboarding_complete_marks_true(auth_client, user):
    assert user.onboarding_completed is False
    resp = auth_client.post(reverse("onboarding-complete"))
    assert resp.status_code == 200
    user.refresh_from_db()
    assert user.onboarding_completed is True


@pytest.mark.django_db
def test_onboarding_complete_idempotent(auth_client, user):
    auth_client.post(reverse("onboarding-complete"))
    resp = auth_client.post(reverse("onboarding-complete"))
    assert resp.status_code == 200
    assert resp.data["onboarding_completed"] is True


# ── CookieJWTAuthentication ──────────────────────────────────────────

@pytest.mark.django_db
def test_cookie_jwt_auth_returns_none_without_cookie(user):
    request = RequestFactory().get("/")
    assert CookieJWTAuthentication().authenticate(request) is None


@pytest.mark.django_db
def test_cookie_jwt_auth_returns_none_for_invalid_token():
    request = RequestFactory().get("/")
    request.COOKIES["access_token"] = "garbage-token"
    assert CookieJWTAuthentication().authenticate(request) is None


@pytest.mark.django_db
def test_cookie_jwt_auth_returns_user_for_valid_token(user):
    token = AccessToken.for_user(user)
    request = RequestFactory().get("/")
    request.COOKIES["access_token"] = str(token)

    result = CookieJWTAuthentication().authenticate(request)
    assert result is not None
    authed_user, validated_token = result
    assert authed_user.id == user.id
