from django.db import models
from django.conf import settings

class League(models.Model):
    name = models.CharField(max_length=20,unique=True)
    description = models.CharField(max_length=100, blank=True)
    creator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_leagues')
    members = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='leagues', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name