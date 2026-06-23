import pytest
from django.contrib.auth import get_user_model, authenticate
from django.db import IntegrityError
from unittest.mock import MagicMock, patch
from challenges.models import Challenge, ChallengeClaim
from rest_framework.test import APIClient

User = get_user_model()

@pytest.fixture
def fixture_challenge():
	return Challenge.objects.create(
		code="1",
		kind="daily",
		title="Test Challenge #1",
		metric="Test Metrics",
	)

@pytest.fixture
def fixture_user():
	return User.objects.create_user(
		email="test@example.com",
		username="testuser",
		password="Testpassword123"
	)

@pytest.mark.django_db
def test_challenge_code_uniqueness(fixture_challenge):
	with pytest.raises(IntegrityError):
		Challenge.objects.create(
			code="1",
			kind="daily",
			title="Test Challenge #1 Duplicate",
			metric="Test Metric"
		)

@pytest.mark.django_db
def test_challenge_str_method(fixture_challenge):
	assert str(fixture_challenge) == "[daily] Test Challenge #1"

@pytest.mark.django_db
def test_challenge_claim_uniqueness(fixture_user, fixture_challenge):
	ChallengeClaim.objects.create(
		user=fixture_user,
		challenge=fixture_challenge,
		period="2023-01-01"
	)
	with pytest.raises(IntegrityError):
		ChallengeClaim.objects.create(
			user=fixture_user,
			challenge=fixture_challenge,
			period="2023-01-01"
	 )

@pytest.mark.django_db
def test_challengelistview_returns_200_on_valid_request(fixture_user, fixture_challenge):
	client = APIClient()
	client.force_authenticate(user=fixture_user)
	response = client.get("/api/challenges/")
	assert response.status_code == 200
	assert len(response.data) == 2
	assert response.data["daily"][0]["code"] == "1"

@pytest.mark.django_db
def test_challengeclaimview_returns_404_on_unknown_code(fixture_user,):
	client = APIClient()
	client.force_authenticate(user=fixture_user)
	response = client.post("/api/challenges/0/claim/")
	assert response.status_code == 404
	assert response.data["error"] == "Défi introuvable."

@pytest.mark.django_db
def test_challengeclaimview_returns_400_on_challenge_not_completed(fixture_user, fixture_challenge):
	client = APIClient()
	client.force_authenticate(user=fixture_user)
	response = client.post("/api/challenges/1/claim/")
	assert response.status_code == 400
	assert response.data["error"] == "Défi non terminé."

@pytest.mark.django_db
def test_challengeclaimview_returns_200_on_valid_claim(fixture_user, fixture_challenge):
	with patch("challenges.views.services.claim_challenge") as mock_claim:
		mock_claim.return_value = 150.00
		client = APIClient()
		client.force_authenticate(user=fixture_user)
		response = client.post("/api/challenges/1/claim/")
		assert response.status_code == 200
		assert response.data["wallet"] == 150.00

@pytest.mark.django_db
def test_challengeclaimview_returns_400_on_already_claimed(fixture_user, fixture_challenge):
	with patch("challenges.views.services.claim_challenge") as mock_claim:
		mock_claim.side_effect = ValueError("already_claimed")
		client = APIClient()
		client.force_authenticate(user=fixture_user)
		response = client.post("/api/challenges/1/claim/")
		assert response.status_code == 400
		assert response.data["error"] == "Récompense déjà récupérée."

@pytest.mark.django_db
def test_badgelistview_returns_200_on_valid_request(fixture_user):
	client = APIClient()
	client.force_authenticate(user=fixture_user)
	response = client.get("/api/badges/")
	assert response.status_code == 200