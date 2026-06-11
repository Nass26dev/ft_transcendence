import pytest
from django.contrib.auth import get_user_model
from django.contrib.auth import authenticate
from django.db import IntegrityError 

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

