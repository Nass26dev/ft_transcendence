from django.db import models
from django.conf import settings
from league.models import League

class Message(models.Model):
    league = models.ForeignKey(League,on_delete=models.CASCADE,related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.CASCADE,related_name='messages')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"{self.sender} : {self.content[:50]}"