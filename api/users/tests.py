import pytest
from django.contrib.auth import get_user_model, authenticate
from django.db import IntegrityError
from django.utils import timezone
from sib_api_v3_sdk.rest import ApiException
from unittest.mock import MagicMock, patch
from users.services import send_2fa_email
from rest_framework.test import APIClient

User = get_user_model()

@pytest.fixture
def basic_user():
	return User.objects.create_user(
		email="test@example.com",
		username="testuser",
		password="Testpassword123"
	)

@pytest.mark.django_db
def test_user_creation(basic_user):
	assert basic_user.wallet == 100.00
	assert basic_user.status == "user"
	assert basic_user.bio == ""
	assert basic_user.onboarding_completed == False
	assert str(basic_user) == "test@example.com"

@pytest.mark.django_db
def test_user_wallet(basic_user):
	assert basic_user.wallet == 100.00

@pytest.mark.django_db
def test_user_status(basic_user):
	assert basic_user.status == "user"

@pytest.mark.django_db
def test_user_str(basic_user):
	assert str(basic_user) == "test@example.com"

@pytest.mark.django_db
def test_user_email_uniqueness(basic_user):
	with pytest.raises(IntegrityError):
		User.objects.create_user(
			email="test@example.com",
			username="anotheruser",
			password="Anotherpassword123"
		)

@pytest.mark.django_db
def test_user_mail_authentication(basic_user):
	user = authenticate(
		email="test@example.com",
		password="Testpassword123"
	)
	assert user is not None

@pytest.mark.django_db
def test_user_password_stored_as_hash(basic_user):
	assert basic_user.password != "Testpassword123"
	assert basic_user.check_password("Testpassword123") == True

def test_send_2fa_email_returns_true_on_success():
	with patch("users.services.sib_api_v3_sdk.TransactionalEmailsApi") as mock_api:
		mock_instance = mock_api.return_value
		mock_instance.send_transac_email.return_value = True
		with patch.dict("os.environ", {"BREVO_API_KEY" : "fake-key"}):
			assert send_2fa_email("test@example.com", "123456") == True

def test_send_2fa_email_returns_false_when_no_api_key():
	with patch.dict("os.environ", {}, clear=True):
		assert send_2fa_email("test@example.com", "123456") == False



def test_send_2fa_email_returns_false_on_api_exception():
	with patch("users.services.sib_api_v3_sdk.TransactionalEmailsApi") as mock_api:
		mock_instance = mock_api.return_value
		mock_instance.send_transac_email.side_effect = ApiException()
		with patch.dict("os.environ", {"BREVO_API_KEY" : "fake-key"}):
			assert send_2fa_email("test@example.com", "123456") == False

@pytest.mark.django_db
def test_register_returns_400_on_diff_passwords():
	client = APIClient()
	response = client.post("/api/register/", {
		"email": "test3@example.com",
		"username": "testuser3",
		"password1": "Testpassword123",
		"password2": "Anotherpassword123"
	})
	assert not User.objects.filter(email="test3@example.com").exists()
	assert response.status_code == 400

@pytest.mark.django_db
def test_register_returns_400_on_empty_email():
	client = APIClient()
	response = client.post("/api/register/", {
		"email": "",
		"username": "testuser4",
		"password1": "Testpassword123",
		"password2": "Testpassword123"
	})
	assert response.status_code == 400

@pytest.mark.xfail(reason="bug RegisterSerializer.save()")
@pytest.mark.django_db
def test_register_returns_400_on_email_already_exists(basic_user):
	client = APIClient()
	response = client.post("/api/register/", {
		"email": "test@example.com",
		"username": "email_already_exists",
		"password1": "Testpassword123",
		"password2": "Testpassword123"
	})
	assert not User.objects.filter(username="email_already_exists").exists()
	assert response.status_code == 400

@pytest.mark.xfail(reason="bug RegisterSerializer.save()")
@pytest.mark.django_db
def test_register_returns_201_on_valid_data():
	client = APIClient()
	response = client.post("/api/register/", {
		"email": "test2@example.com",
		"username": "testuser2",
		"password1": "Testpassword123",
		"password2": "Testpassword123"
	})
	assert User.objects.filter(email="test2@example.com").exists()
	assert response.status_code == 201

@pytest.mark.django_db
def test_login_step1_returns_200_on_valid_credentials_and_email_sent(basic_user):
	with patch("users.views.send_2fa_email") as mock_send_email:
		mock_send_email.return_value = True
		client = APIClient()
		response = client.post("/api/login/", {
			"email": basic_user.email,
			"password": "Testpassword123"
		})
		assert response.status_code == 200


@pytest.mark.django_db
def test_login_step1_returns_500_on_email_failure(basic_user):
	with patch("users.views.send_2fa_email") as mock_send_email:
		mock_send_email.return_value = False
		client = APIClient()
		response = client.post("/api/login/", {
			"email": basic_user.email,
			"password": "Testpassword123"
		})
		assert response.status_code == 500

@pytest.mark.django_db
def test_login_step1_returns_401_on_invalid_credentials():
	client = APIClient()
	response = client.post("/api/login/", {
		"email": "nonexistent@example.com",
		"password": "Wrongpassword123"
	})
	assert response.status_code == 401

@pytest.mark.django_db
def test_login_verify_returns_200_on_valid_2fa_code(basic_user):
	with patch("users.views.cache.get") as mock_cache_get:
		mock_cache_get.return_value = "123456"
		client = APIClient()
		response = client.post("/api/login/verify/", {
			"user_id": basic_user.id,
			"code": "123456"
		})
		assert response.status_code == 200

@pytest.mark.xfail(reason="111111 == 111111 is always True (cf l53 views.py ),4 prod post login_verify() will check if code_saisi == code_attendu")
@pytest.mark.django_db
def test_login_verify_returns_400_on_wrong_code(basic_user):
	with patch("users.views.cache.get") as mock_cache_get:
		mock_cache_get.return_value = "123456"
		client = APIClient()
		response = client.post("/api/login/verify/", {
			"user_id": basic_user.id,
			"code": "000000"
		})
		assert response.status_code == 400

@pytest.mark.django_db
def test_profileview_returns_200_for_authenticated_user(basic_user):
	client = APIClient()
	client.force_authenticate(user=basic_user)
	response = client.get("/api/profile/")
	assert response.status_code == 200
	assert response.data["email"] == basic_user.email

@pytest.mark.django_db
def test_dailybonusview_returns_200_for_authenticated_user(basic_user):
	client = APIClient()
	client.force_authenticate(user=basic_user)
	response = client.post("/api/daily-bonus/")
	assert response.status_code == 200

@pytest.mark.django_db
def test_dailybonusview_returns_400_if_already_claimed(basic_user):
	basic_user.last_daily_bonus = timezone.localdate()
	basic_user.save()
	client = APIClient()
	client.force_authenticate(user=basic_user)
	response = client.post("/api/daily-bonus/")
	assert response.status_code == 400

@pytest.mark.django_db
def test_onboarding_completion_view_returns_200_for_authenticated_user(basic_user):
	client = APIClient()
	client.force_authenticate(user=basic_user)
	response = client.post("/api/onboarding/complete/")
	assert response.status_code == 200
	basic_user.refresh_from_db()
	assert basic_user.onboarding_completed == True