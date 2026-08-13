import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()


@pytest.fixture
def api_client():
    """Client DRF non authentifié."""
    return APIClient()


@pytest.fixture
def user(db):
    """Utilisateur de test standard."""
    return User.objects.create_user(
        email="user1@example.com", username="user1", password="Testpassword123"
    )


@pytest.fixture
def other_user(db):
    """Second utilisateur, pour les tests d'isolation/permissions."""
    return User.objects.create_user(
        email="user2@example.com", username="user2", password="Testpassword123"
    )


@pytest.fixture
def auth_client(api_client, user):
    """Client DRF authentifié en tant que `user` (bypass JWT via force_authenticate)."""
    api_client.force_authenticate(user=user)
    return api_client
