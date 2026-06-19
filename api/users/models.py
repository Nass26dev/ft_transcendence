from decimal import Decimal

from django.contrib.auth.models import AbstractUser
from django.db import models

# Plafond du solde (monnaie virtuelle). Le crédit est clampé à cette valeur,
# bien en-dessous de la capacité du champ (max_digits=14), donc aucun risque
# de débordement en base.
MAX_WALLET = Decimal("1000000000.00")  # 1 milliard de Kops


class User(AbstractUser):

    email = models.EmailField(unique=True)
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    Status = [("admin", "admin"), ("owner", "owner"), ("user", "user")]
    status = models.CharField (max_length=10, choices=Status, default="user")
    wallet = models.DecimalField(max_digits=14, decimal_places=2, default=100.00)
    bio = models.TextField(blank=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    last_daily_bonus = models.DateField(null=True, blank=True)
    # Dernier jour où l'utilisateur a tourné la roue de la chance (1×/jour).
    last_wheel_spin = models.DateField(null=True, blank=True)
    onboarding_completed = models.BooleanField(default=False)
    # Profil public : apparaît dans les classements et le feed des amis.
    is_public = models.BooleanField(default=True)

    def __str__(self):
        return self.email