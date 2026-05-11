"""
matches/models.py
"""

from django.db import models


# Slugs courts cohérents avec le front  L1 | UCL | PL | LIGA | BUN | SA
COMPETITION_CHOICES = [
    ("L1",   "Ligue 1"),
    ("UCL",  "Champions League"),
    ("PL",   "Premier League"),
    ("LIGA", "La Liga"),
    ("BUN",  "Bundesliga"),
    ("SA",   "Serie A"),
]

STATUS_CHOICES = [
    ("soon",     "À venir"),
    ("live",     "En direct"),
    ("finished", "Terminé"),
]


class Match(models.Model):
    # ---- Identifiants ----
    id_api          = models.IntegerField(null=True, unique=True)

    # ---- Compétition ----
    competition     = models.CharField(max_length=10, choices=COMPETITION_CHOICES)  # "L1", "PL"…

    # ---- Équipes ----
    home_team       = models.CharField(max_length=100)
    away_team       = models.CharField(max_length=100)
    home_team_crest = models.URLField(max_length=500, blank=True, null=True)
    away_team_crest = models.URLField(max_length=500, blank=True, null=True)

    # ---- Horaire & statut ----
    time            = models.DateTimeField()             # datetime UTC du coup d'envoi
    status          = models.CharField(max_lejngth=20, choices=STATUS_CHOICES, default="soon")
    minute          = models.SmallIntegerField(null=True, blank=True)  # minute de jeu si live

    # ---- Score ----
    home_score      = models.IntegerField(blank=True, null=True)
    away_score      = models.IntegerField(blank=True, null=True)

    # ---- Cotes 1 / X / 2 ----
    odd_home        = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    odd_draw        = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    odd_away        = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)

    # ---- Confiance communautaire (%) ----
    conf_home       = models.SmallIntegerField(null=True, blank=True)
    conf_draw       = models.SmallIntegerField(null=True, blank=True)
    conf_away       = models.SmallIntegerField(null=True, blank=True)

    def __str__(self):
        score = f"{self.home_score}-{self.away_score}" if self.home_score is not None else "vs"
        return f"[{self.competition}] {self.home_team} {score} {self.away_team}"

    class Meta:
        indexes = [
            models.Index(fields=["competition", "time"], name="idx_match_comp_time"),
            models.Index(fields=["status"],               name="idx_match_status"),
            models.Index(fields=["time"],                 name="idx_match_time"),
        ]


class Standing(models.Model):
    competition   = models.CharField(max_length=10, choices=COMPETITION_CHOICES)
    team_name     = models.CharField(max_length=150)
    rank          = models.SmallIntegerField()
    played        = models.SmallIntegerField(default=0)
    wins          = models.SmallIntegerField(default=0)
    draws         = models.SmallIntegerField(default=0)
    losses        = models.SmallIntegerField(default=0)
    goals_for     = models.SmallIntegerField(default=0)
    goals_against = models.SmallIntegerField(default=0)
    goal_diff     = models.SmallIntegerField(default=0)
    points        = models.SmallIntegerField(default=0)
    updated_at    = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.rank}. {self.team_name} ({self.competition}) — {self.points} pts"

    class Meta:
        unique_together = [("competition", "team_name")]
        indexes = [
            models.Index(fields=["competition", "rank"], name="idx_standing_comp_rank"),
        ]