import pytest
from django.contrib.auth import get_user_model, authenticate
from django.db import IntegrityError
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
def test_register_returns_201_on_valid_data():
	client = APIClient()
	# Route officielle (dj-rest-auth). L'ancienne /api/register/ dupliquait
	# celle-ci sans passer `request` au serializer : supprimée.
	response = client.post("/api/auth/registration/", {
		"email": "test2@example.com",
		"username": "testuser",
		"password1": "Testpassword123",
		"password2": "Testpassword123"
	})
	assert response.status_code == 201
	assert User.objects.filter(email="test2@example.com").exists()

@pytest.mark.django_db
def test_register_ignores_client_supplied_wallet():
	"""Le solde de depart ne doit pas etre pilotable par le client."""
	client = APIClient()
	response = client.post("/api/auth/registration/", {
		"email": "test3@example.com",
		"password1": "Testpassword123",
		"password2": "Testpassword123",
		"wallet": "50000"
	})
	assert response.status_code == 201
	assert User.objects.get(email="test3@example.com").wallet == 100.00
