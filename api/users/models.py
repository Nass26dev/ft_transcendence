from datetime import timedelta
from decimal import Decimal

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone

MAX_WALLET = Decimal("1000000000.00")

# Fenêtre au-delà de laquelle un utilisateur est considéré hors ligne. On ne
# peut pas savoir qu'un navigateur s'est fermé (aucun événement n'est envoyé) :
# on déduit donc la présence d'une activité récente plutôt que de maintenir un
# booléen, qui resterait bloqué à True après un crash ou une coupure réseau.
ONLINE_WINDOW = timedelta(minutes=5)

# Fréquence maximale d'écriture de `last_seen`. Sans ce palier, chaque requête
# authentifiée déclencherait un UPDATE, soit plusieurs écritures par seconde
# et par utilisateur pour une information à la minute près.
LAST_SEEN_REFRESH = timedelta(seconds=60)


class User(AbstractUser):
    """Utilisateur applicatif : identifiants, statut, solde virtuel et préférences de profil."""

    email = models.EmailField(unique=True)
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    Status = [("admin", "admin"), ("owner", "owner"), ("user", "user")]
    status = models.CharField (max_length=10, choices=Status, default="user")
    wallet = models.DecimalField(max_digits=14, decimal_places=2, default=100.00)
    bio = models.TextField(blank=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    last_daily_bonus = models.DateField(null=True, blank=True)
    last_wheel_spin = models.DateField(null=True, blank=True)
    onboarding_completed = models.BooleanField(default=False)
    is_public = models.BooleanField(default=True)
    last_seen = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        """Représentation lisible de l'utilisateur (son email)."""
        return self.email

    @property
    def is_online(self) -> bool:
        """Vrai si l'utilisateur a été actif dans les `ONLINE_WINDOW` dernières minutes."""
        if self.last_seen is None:
            return False
        return timezone.now() - self.last_seen < ONLINE_WINDOW

    def touch_last_seen(self) -> None:
        """Marque l'utilisateur comme actif, au plus une écriture par minute.

        L'UPDATE passe par le queryset (et non `save()`) pour n'écrire qu'une
        colonne sans relire la ligne ni déclencher les signaux : cette méthode
        est appelée sur chaque requête authentifiée.
        """
        now = timezone.now()
        if self.last_seen is not None and now - self.last_seen < LAST_SEEN_REFRESH:
            return
        type(self).objects.filter(pk=self.pk).update(last_seen=now)
        self.last_seen = now
