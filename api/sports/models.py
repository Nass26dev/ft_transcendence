from django.db import models

class Sport(models.Model):
    """Un sport (ex. football), racine de la hiérarchie compétition/équipe/match."""

    name = models.CharField(max_length=50)
    slug = models.SlugField(unique=True)

    def __str__(self):
        """Représentation lisible : le nom du sport."""
        return self.name


class Competition(models.Model):
    """Une compétition (championnat, coupe) rattachée à un sport et une saison."""

    sport = models.ForeignKey(Sport, on_delete=models.CASCADE, related_name="competitions")
    name = models.CharField(max_length=100)
    slug = models.SlugField()
    season = models.CharField(max_length=20, blank=True)
    country = models.CharField(max_length=50, blank=True)
    logo_url = models.URLField(blank=True)

    class Meta:
        """Une compétition est identifiée par son slug pour une saison donnée."""

        unique_together = [("slug", "season")]

    def __str__(self):
        """Représentation lisible : nom et saison de la compétition."""
        return f"{self.name} ({self.season})"


class Team(models.Model):
    """Une équipe rattachée à une compétition.

    color_primary/color_secondary sont les couleurs officielles du club (hex,
    ex. "#EF0107"), récupérées en même temps que le logo : elles servent à
    colorer le maillot générique quand le vrai logo n'est pas (encore) trouvé,
    plutôt que le rouge/bleu domicile-extérieur par défaut.
    """

    competition = models.ForeignKey(Competition, on_delete=models.CASCADE, related_name="teams")
    name = models.CharField(max_length=100)
    short_name = models.CharField(max_length=20, blank=True)
    logo_url = models.URLField(blank=True)
    color_primary = models.CharField(max_length=7, blank=True)
    color_secondary = models.CharField(max_length=7, blank=True)
    logo_checked_at = models.DateTimeField(null=True, blank=True)
    external_id = models.CharField(max_length=50, blank=True, db_index=True)

    class Meta:
        """Empêche les doublons d'équipe créés par la course entre tâches de
        scraping concurrentes (get_or_create sans contrainte BDD).
        """

        unique_together = [("competition", "name")]

    def __str__(self):
        """Représentation lisible : le nom de l'équipe."""
        return self.name


class Match(models.Model):
    """Un match entre deux équipes d'une compétition, avec son état live et ses
    détails enrichis depuis la fiche foot-live (arbitre, lieu, événements...).
    """

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

    footlive_id = models.CharField(max_length=20, blank=True, db_index=True)
    detail_url = models.CharField(max_length=300, blank=True)
    referee = models.CharField(max_length=120, blank=True)
    venue = models.CharField(max_length=120, blank=True)
    stage = models.CharField(max_length=120, blank=True)
    ht_home_score = models.IntegerField(null=True, blank=True)
    ht_away_score = models.IntegerField(null=True, blank=True)
    details_fetched_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        """Indexé par statut/coup d'envoi, trié par coup d'envoi croissant."""

        indexes = [
            models.Index(fields=["status", "kickoff_at"]),
        ]
        ordering = ["kickoff_at"]

    def __str__(self):
        """Représentation lisible : équipes et date/heure du coup d'envoi."""
        return f"{self.home_team} vs {self.away_team} ({self.kickoff_at:%Y-%m-%d %H:%M})"


class MatchEvent(models.Model):
    """Action d'un match (but, carton, remplacement) extraite de la fiche foot-live.

    Pour un remplacement, `player` est le joueur entrant et `player_out` le
    joueur sortant.
    """

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
    player_out = models.CharField(max_length=120, blank=True)

    class Meta:
        """Trié par minute puis par id, indexé par match/minute."""

        ordering = ["minute", "id"]
        indexes = [models.Index(fields=["match", "minute"])]

    def __str__(self):
        """Représentation lisible : minute, type d'événement et joueur."""
        return f"{self.minute}' {self.get_type_display()} : {self.player}"


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
        """Trié par côté puis par rôle puis par id, indexé par match/côté/rôle."""

        ordering = ["team_side", "role", "id"]
        indexes = [models.Index(fields=["match", "team_side", "role"])]

    def __str__(self):
        """Représentation lisible : numéro, joueur, côté et rôle."""
        return f"{self.number or '–'} {self.player} ({self.team_side}/{self.role})"


class Odds(models.Model):
    """Une cote pour une issue d'un match, sur un marché donné (1N2, over/under, btts).

    `selection` dépend du marché : home/draw/away pour 1N2, over/under pour
    over_under, yes/no pour btts.
    """

    Market  = [
        ("1N2", "1N2"),
        ("over_under", "Over/Under"),
        ("btts", "Both Teams To Score")
    ]

    match = models.ForeignKey(Match, on_delete=models.CASCADE, related_name="odds")
    market = models.CharField(max_length=20, choices=Market)
    selection = models.CharField(max_length=20)
    value = models.DecimalField(max_digits=6, decimal_places=2)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        """Une cote est unique par match, marché et sélection."""

        unique_together = [("match", "market", "selection")]
        verbose_name_plural = "Odds"

    def __str__(self):
        """Représentation lisible : match, marché/sélection et valeur de la cote."""
        return f"{self.match} : {self.market}/{self.selection} @ {self.value}"
