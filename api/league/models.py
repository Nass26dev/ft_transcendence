from django.db import models
from django.conf import settings

class LeagueInvitation(models.Model):
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
        unique_together = ('league', 'receiver')


class League(models.Model):
    name = models.CharField(max_length=20,unique=True)
    description = models.CharField(max_length=100, blank=True)
    creator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_leagues')
    members = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='leagues', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name