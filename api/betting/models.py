from django.conf import settings
from django.db import models
from sports.models import Match, Odds


class Bet(models.Model):

    STATUS = [
        ("pending", "Pending"),
        ("won", "Won"),
        ("lost", "Lost"),
        ("cancelled", "Cancelled"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="bets"
    )

    match = models.ForeignKey(
        Match,
        on_delete=models.CASCADE,
        related_name="bets"
    )

    odd = models.ForeignKey(
        Odds,
        on_delete=models.PROTECT,
        related_name="bets"
    )

    stake = models.DecimalField(max_digits=10, decimal_places=2)

    status = models.CharField(
        max_length=20,
        choices=STATUS,
        default="pending"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    settled_at = models.DateTimeField(null=True, blank=True)

    def save(self, *args, **kwargs):
        self.potential_win = self.stake
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user} — {self.match}"