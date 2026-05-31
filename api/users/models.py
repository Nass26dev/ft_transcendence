from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):

    email = models.EmailField(unique=True)
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    wallet = models.DecimalField(max_digits=10, decimal_places=2, default=100.00)
    bio = models.TextField(blank=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    last_daily_bonus = models.DateField(null=True, blank=True)
    onboarding_completed = models.BooleanField(default=False)

    def __str__(self):
        return self.email