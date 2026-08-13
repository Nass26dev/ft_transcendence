from django.conf import settings
from django.db import models


class Challenge(models.Model):
    """Définition d'un défi (quotidien ou saison). Progression calculée à la volée."""

    KIND = [("daily", "Daily"), ("season", "Season")]

    code = models.SlugField(unique=True)
    kind = models.CharField(max_length=10, choices=KIND)
    title = models.CharField(max_length=120)
    description = models.CharField(max_length=200, blank=True)
    icon = models.CharField(max_length=8, blank=True)
    metric = models.CharField(max_length=30)
    target = models.PositiveIntegerField(default=1)
    reward = models.PositiveIntegerField(default=0)
    order = models.PositiveIntegerField(default=0)
    active = models.BooleanField(default=True)

    class Meta:
        """Trié par type de défi puis par ordre d'affichage."""

        ordering = ["kind", "order"]

    def __str__(self):
        """Représentation lisible : type et titre du défi."""
        return f"[{self.kind}] {self.title}"


class Badge(models.Model):
    """Définition d'un badge, débloqué quand metric >= threshold."""

    code = models.SlugField(unique=True)
    emoji = models.CharField(max_length=8, blank=True)
    name = models.CharField(max_length=80)
    description = models.CharField(max_length=200, blank=True)
    metric = models.CharField(max_length=30)
    threshold = models.PositiveIntegerField(default=1)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        """Trié par ordre d'affichage."""

        ordering = ["order"]

    def __str__(self):
        """Représentation lisible : le nom du badge."""
        return self.name


class ChallengeClaim(models.Model):
    """Récompense d'un défi réclamée par un user, pour une période donnée.

    period = date ISO (défi quotidien) ou "season" (défi saison).
    """

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="challenge_claims")
    challenge = models.ForeignKey(Challenge, on_delete=models.CASCADE, related_name="claims")
    period = models.CharField(max_length=20)
    claimed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        """Une seule réclamation par utilisateur, défi et période."""

        unique_together = ("user", "challenge", "period")


class UserBadge(models.Model):
    """Badge débloqué par un user."""

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="badges")
    badge = models.ForeignKey(Badge, on_delete=models.CASCADE, related_name="holders")
    unlocked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        """Un badge ne peut être débloqué qu'une seule fois par utilisateur."""

        unique_together = ("user", "badge")
