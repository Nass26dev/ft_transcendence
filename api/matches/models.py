from django.db import models

class Match(models.Model):
    id_api = models.IntegerField(unique=True, null=True) 
    
    competition = models.CharField(max_length=100)
    status = models.CharField(max_length=20)
    time = models.DateTimeField()
    home_team = models.CharField(max_length=100)
    away_team = models.CharField(max_length=100)
    home_score = models.IntegerField(null=True, blank=True)
    away_score = models.IntegerField(null=True, blank=True)

    def __str__(self):
        return f"{self.home_team} vs {self.away_team}"