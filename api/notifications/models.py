from django.conf import settings
from django.db import models


class Notification(models.Model):
    """Notification destinée à un utilisateur (message, ami, ligue, pari…)."""

    TYPES = [
        ("dm", "Message privé"),
        ("friend_request", "Demande d'ami"),
        ("league_invite", "Invitation à une ligue"),
        ("bet_settled", "Pari réglé"),
    ]

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    # Auteur de l'évènement (peut être nul : règlement automatique d'un pari).
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
    )
    type = models.CharField(max_length=20, choices=TYPES)
    message = models.TextField()
    # Route frontend vers laquelle pointe la notif (ex. "/friends", "/tickets").
    url = models.CharField(max_length=200, blank=True, default="")
    # Données contextuelles libres (ex. {"league_id": 3}).
    data = models.JSONField(default=dict, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"[{self.type}] -> {self.recipient_id}: {self.message[:40]}"
