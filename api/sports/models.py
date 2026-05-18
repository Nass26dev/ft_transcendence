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

    class Meta:
        indexes = [
            models.Index(fields=["status", "kickoff_at"]),
        ]
        ordering = ["kickoff_at"]

    def __str__(self):
        return f"{self.home_team} vs {self.away_team} — {self.kickoff_at:%Y-%m-%d %H:%M}"


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
