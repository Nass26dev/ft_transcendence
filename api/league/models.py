from django.db import models
from django.conf import settings

class LeagueInvitation(models.Model):
    """Invitation à rejoindre une ligue.

    Seul le créateur de la ligue peut en envoyer (vérifié côté vue, pas ici).
    Supprimée dès qu'elle est acceptée ou refusée : son existence en base
    signifie donc toujours "en attente".
    """

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('refused', 'Refused'),
    ]

    league = models.ForeignKey("League",related_name="invitations",on_delete=models.CASCADE)
    sender = models.ForeignKey(settings.AUTH_USER_MODEL,related_name="sent_league_invites",on_delete=models.CASCADE)
    receiver = models.ForeignKey(settings.AUTH_USER_MODEL,related_name="received_league_invites",on_delete=models.CASCADE)
    status = models.CharField(max_length=10,choices=STATUS_CHOICES,default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        """Un même utilisateur ne peut avoir qu'une invitation par ligue."""

        unique_together = ('league', 'receiver')


class League(models.Model):
    """Ligue de joueurs.

    Le créateur (`creator`) est le seul habilité à inviter et à expulser des
    membres, et ne peut jamais quitter sa propre ligue (règles appliquées côté
    vues). Les membres simples (`members`) peuvent la quitter librement.
    """

    name = models.CharField(max_length=20,unique=True)
    description = models.CharField(max_length=100, blank=True)
    creator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_leagues')
    members = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='leagues', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        """Représentation lisible : le nom de la ligue."""
        return self.name