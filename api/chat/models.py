from django.db import models
from django.conf import settings


class Message(models.Model):
    # ligue = quand la ligue sera cree
    sender = models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.CASCADE,related_name='messages')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)


    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"{self.sender} : {self.content[:50]}"