from django.conf import settings
from django.db import models


class Notification(models.Model):
    """Notification destinée à un utilisateur (message, ami, ligue, pari…).

    `actor` est l'auteur de l'évènement et peut être nul (ex. règlement
    automatique d'un pari sans acteur humain), d'où le SET_NULL. `url` est
    la route frontend vers laquelle pointe la notif (ex. "/friends",
    "/tickets") et `data` porte des données contextuelles libres
    (ex. {"league_id": 3}).
    """

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
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
    )
    type = models.CharField(max_length=20, choices=TYPES)
    message = models.TextField()
    url = models.CharField(max_length=200, blank=True, default="")
    data = models.JSONField(default=dict, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        """Représentation texte lisible de la notification."""
        return f"[{self.type}] -> {self.recipient_id}: {self.message[:40]}"
