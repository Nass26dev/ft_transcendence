from django.conf import settings
from django.db import models
from sports.models import Match, Odds


STATUS = [
    ("pending", "Pending"),
    ("won", "Won"),
    ("lost", "Lost"),
    ("cancelled", "Cancelled"),
]


class Bet(models.Model):
    """Ticket de pari. Une jambe (simple) ou plusieurs (combiné).

    Les sélections vivent dans `BetSelection`. `odd_value` est la cote totale
    du ticket (produit des cotes des jambes au moment du pari) ; `status` est
    le statut global du ticket (gagné seulement si toutes les jambes gagnent).
    """

    STATUS = STATUS

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="bets"
    )

    stake = models.DecimalField(max_digits=14, decimal_places=2)

    odd_value = models.DecimalField(max_digits=14, decimal_places=2)

    status = models.CharField(
        max_length=20,
        choices=STATUS,
        default="pending"
    )

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    settled_at = models.DateTimeField(null=True, blank=True)

    @property
    def is_combo(self):
        """Vrai si le ticket contient plusieurs sélections (pari combiné)."""
        return self.selections.count() > 1

    def __str__(self):
        """Représentation lisible : utilisateur et numéro de ticket."""
        return f"{self.user} (ticket #{self.pk})"


class BetSelection(models.Model):
    """Une jambe d'un ticket : un match + une sélection, avec son statut propre."""

    STATUS = STATUS

    bet = models.ForeignKey(
        Bet,
        on_delete=models.CASCADE,
        related_name="selections"
    )

    match = models.ForeignKey(
        Match,
        on_delete=models.CASCADE,
        related_name="bet_selections"
    )

    odd = models.ForeignKey(
        Odds,
        on_delete=models.PROTECT,
        related_name="bet_selections"
    )

    odd_value = models.DecimalField(max_digits=6, decimal_places=2)

    status = models.CharField(max_length=20, choices=STATUS, default="pending")
    settled_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        """Représentation lisible : ticket, match et sélection."""
        return f"#{self.bet_id} : {self.match} ({self.odd.selection})"