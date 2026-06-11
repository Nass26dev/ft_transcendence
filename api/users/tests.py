import pytest
from django.contrib.auth import get_user_model

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
