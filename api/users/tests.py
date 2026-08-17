from datetime import timedelta

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
	"""Crée un utilisateur de base pour les tests."""
	return User.objects.create_user(
		email="test@example.com",
		username="testuser",
		password="Testpassword123"
	)

@pytest.mark.django_db
def test_user_creation(basic_user):
	"""Vérifie les valeurs par défaut d'un utilisateur nouvellement créé."""
	assert basic_user.wallet == 100.00
	assert basic_user.status == "user"
	assert basic_user.bio == ""
	assert basic_user.onboarding_completed == False
	assert str(basic_user) == "test@example.com"

@pytest.mark.django_db
def test_user_wallet(basic_user):
	"""Le solde initial est de 100."""
	assert basic_user.wallet == 100.00

@pytest.mark.django_db
def test_user_status(basic_user):
	"""Le statut par défaut est 'user'."""
	assert basic_user.status == "user"

@pytest.mark.django_db
def test_user_str(basic_user):
	"""La représentation texte de l'utilisateur est son email."""
	assert str(basic_user) == "test@example.com"

@pytest.mark.django_db
def test_user_email_uniqueness(basic_user):
	"""Un second compte avec le même email lève une IntegrityError."""
	with pytest.raises(IntegrityError):
		User.objects.create_user(
			email="test@example.com",
			username="anotheruser",
			password="Anotherpassword123"
		)

@pytest.mark.django_db
def test_user_mail_authentication(basic_user):
	"""L'authentification par email + mot de passe fonctionne."""
	user = authenticate(
		email="test@example.com",
		password="Testpassword123"
	)
	assert user is not None

@pytest.mark.django_db
def test_user_password_stored_as_hash(basic_user):
	"""Le mot de passe est stocké haché, mais reste vérifiable via check_password."""
	assert basic_user.password != "Testpassword123"
	assert basic_user.check_password("Testpassword123") == True

def test_send_2fa_email_returns_true_on_success():
	"""Renvoie True quand l'envoi via l'API Brevo réussit."""
	with patch("users.services.sib_api_v3_sdk.TransactionalEmailsApi") as mock_api:
		mock_instance = mock_api.return_value
		mock_instance.send_transac_email.return_value = True
		with patch.dict("os.environ", {"BREVO_API_KEY" : "fake-key"}):
			assert send_2fa_email("test@example.com", "123456") == True

def test_send_2fa_email_returns_false_when_no_api_key():
	"""Renvoie False si la clé API Brevo n'est pas configurée."""
	with patch.dict("os.environ", {}, clear=True):
		assert send_2fa_email("test@example.com", "123456") == False



def test_send_2fa_email_returns_false_on_api_exception():
	"""Renvoie False si l'API Brevo lève une exception."""
	with patch("users.services.sib_api_v3_sdk.TransactionalEmailsApi") as mock_api:
		mock_instance = mock_api.return_value
		mock_instance.send_transac_email.side_effect = ApiException()
		with patch.dict("os.environ", {"BREVO_API_KEY" : "fake-key"}):
			assert send_2fa_email("test@example.com", "123456") == False

@pytest.mark.django_db
def test_register_returns_201_on_valid_data():
	"""L'inscription via la route officielle dj-rest-auth crée bien l'utilisateur (201)."""
	client = APIClient()
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


# ── Statut en ligne ──────────────────────────────────────────────────

@pytest.mark.django_db
def test_new_user_is_offline(user):
	"""Un compte qui n'a jamais rien fait n'est pas en ligne."""
	assert user.last_seen is None
	assert user.is_online is False


@pytest.mark.django_db
def test_recent_activity_makes_user_online(user):
	from django.utils import timezone
	user.last_seen = timezone.now()
	assert user.is_online is True


@pytest.mark.django_db
def test_old_activity_makes_user_offline(user):
	"""Au-delà de la fenêtre, l'utilisateur redevient hors ligne sans action."""
	from django.utils import timezone
	from users.models import ONLINE_WINDOW
	user.last_seen = timezone.now() - ONLINE_WINDOW - timedelta(seconds=1)
	assert user.is_online is False


@pytest.mark.django_db
def test_touch_last_seen_writes_when_never_seen(user):
	user.touch_last_seen()
	user.refresh_from_db()
	assert user.last_seen is not None


@pytest.mark.django_db
def test_touch_last_seen_is_throttled(user):
	"""Deux appels rapprochés ne doivent produire qu'une seule écriture."""
	from django.utils import timezone
	user.touch_last_seen()
	first = User.objects.get(pk=user.pk).last_seen

	user.touch_last_seen()

	assert User.objects.get(pk=user.pk).last_seen == first


@pytest.mark.django_db
def test_touch_last_seen_writes_again_after_the_refresh_delay(user):
	from django.utils import timezone
	from users.models import LAST_SEEN_REFRESH
	stale = timezone.now() - LAST_SEEN_REFRESH - timedelta(seconds=1)
	User.objects.filter(pk=user.pk).update(last_seen=stale)
	user.last_seen = stale

	user.touch_last_seen()

	assert User.objects.get(pk=user.pk).last_seen > stale


@pytest.mark.django_db
def test_friend_list_exposes_online_status(auth_client, user, other_user):
	"""Le front doit recevoir le statut pour l'afficher dans la liste d'amis."""
	from django.utils import timezone
	from friends.models import Friendship

	Friendship.objects.create(sender=user, receiver=other_user, status="accepted")
	other_user.last_seen = timezone.now()
	other_user.save(update_fields=["last_seen"])

	resp = auth_client.get("/api/friends/")

	assert resp.status_code == 200
	assert resp.data["friends"][0]["user"]["is_online"] is True
