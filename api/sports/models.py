from django.db import models

class Sport(models.Model):
    name = models.CharField(max_length=50)
    slug = models.SlugField(unique=True)

    def __str__(self):
        return self.name


class Competition(models.Model):
    sport = models.ForeignKey(Sport, on_delete=models.CASCADE, related_name="competitions")
    name = models.CharField(max_length=100)
    slug = models.SlugField()
    season = models.CharField(max_length=20, blank=True)
    country = models.CharField(max_length=50, blank=True)
    logo_url = models.URLField(blank=True)

    class Meta:
        unique_together = [("slug", "season")]

    def __str__(self):
        return f"{self.name} ({self.season})"


class Team(models.Model):
    competition = models.ForeignKey(Competition, on_delete=models.CASCADE, related_name="teams")
    name = models.CharField(max_length=100)
    short_name = models.CharField(max_length=20, blank=True)
    logo_url = models.URLField(blank=True)
    external_id = models.CharField(max_length=50, blank=True, db_index=True)

    class Meta:
        # Empêche les doublons d'équipe créés par la course entre tâches de
        # scraping concurrentes (get_or_create sans contrainte BDD).
        unique_together = [("competition", "name")]

    def __str__(self):
        return self.name


class Match(models.Model):
    Status = [
        ("scheduled", "Scheduled"),
        ("live", "Live"),
        ("finished", "Finished"),
        ("cancelled", "Cancelled")
    ]

    competition = models.ForeignKey(Competition, on_delete=models.CASCADE, related_name="matches")
    home_team = models.ForeignKey(Team, on_delete=models.PROTECT, related_name="home_matches")
    away_team = models.ForeignKey(Team, on_delete=models.PROTECT, related_name="away_matches")
    kickoff_at = models.DateTimeField()
    status = models.CharField(max_length=20, choices=Status)
    home_score = models.IntegerField(null=True, blank=True)
    away_score = models.IntegerField(null=True, blank=True)
    current_minute = models.IntegerField(null=True, blank=True)
    external_id = models.CharField(max_length=200, unique=True)
    updated_at = models.DateTimeField(auto_now=True)

    # ── Détails enrichis depuis la fiche foot-live ──
    footlive_id = models.CharField(max_length=20, blank=True, db_index=True)
    detail_url = models.CharField(max_length=300, blank=True)
    referee = models.CharField(max_length=120, blank=True)
    venue = models.CharField(max_length=120, blank=True)
    stage = models.CharField(max_length=120, blank=True)  # phase / groupe
    ht_home_score = models.IntegerField(null=True, blank=True)
    ht_away_score = models.IntegerField(null=True, blank=True)
    details_fetched_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["status", "kickoff_at"]),
        ]
        ordering = ["kickoff_at"]

    def __str__(self):
        return f"{self.home_team} vs {self.away_team} — {self.kickoff_at:%Y-%m-%d %H:%M}"


class MatchEvent(models.Model):
    """Action d'un match (but, carton, remplacement) extraite de la fiche foot-live."""

    Type = [
        ("goal", "But"),
        ("own_goal", "But contre son camp"),
        ("penalty", "Penalty"),
        ("yellow_card", "Carton jaune"),
        ("red_card", "Carton rouge"),
        ("substitution", "Remplacement"),
    ]
    Side = [("home", "Home"), ("away", "Away")]

    match = models.ForeignKey(Match, on_delete=models.CASCADE, related_name="events")
    minute = models.IntegerField(null=True, blank=True)
    type = models.CharField(max_length=20, choices=Type)
    team_side = models.CharField(max_length=4, choices=Side)
    player = models.CharField(max_length=120)
    player_out = models.CharField(max_length=120, blank=True)  # remplacements : sortant

    class Meta:
        ordering = ["minute", "id"]
        indexes = [models.Index(fields=["match", "minute"])]

    def __str__(self):
        return f"{self.minute}' {self.get_type_display()} — {self.player}"


class MatchLineup(models.Model):
    """Joueur d'une feuille de match (titulaire ou remplaçant)."""

    Side = [("home", "Home"), ("away", "Away")]
    Role = [("starter", "Titulaire"), ("substitute", "Remplaçant")]

    match = models.ForeignKey(Match, on_delete=models.CASCADE, related_name="lineups")
    team_side = models.CharField(max_length=4, choices=Side)
    role = models.CharField(max_length=12, choices=Role)
    number = models.IntegerField(null=True, blank=True)
    player = models.CharField(max_length=120)

    class Meta:
        ordering = ["team_side", "role", "id"]
        indexes = [models.Index(fields=["match", "team_side", "role"])]

    def __str__(self):
        return f"{self.number or '–'} {self.player} ({self.team_side}/{self.role})"


class Odds(models.Model):
    Market  = [
        ("1N2", "1N2"),
        ("over_under", "Over/Under"),
        ("btts", "Both Teams To Score")
    ]

    match = models.ForeignKey(Match, on_delete=models.CASCADE, related_name="odds")
    market = models.CharField(max_length=20, choices=Market)
    selection = models.CharField(max_length=20)  # home/draw/away/over/under/yes/no
    value = models.DecimalField(max_digits=6, decimal_places=2)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [("match", "market", "selection")]
        verbose_name_plural = "Odds"

    def __str__(self):
        return f"{self.match} — {self.market}/{self.selection} @ {self.value}"
