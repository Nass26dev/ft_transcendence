from django.db import models
from django.conf import settings
from django.db.models import Q
from league.models import League


class Message(models.Model):
    """Message d'un chat de ligue (discussion de groupe)."""
    league = models.ForeignKey(League, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='messages')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.sender} : {self.content[:50]}"


class Conversation(models.Model):
    """Conversation privée (DM) entre deux utilisateurs.

    On stocke toujours la paire avec user_a.id < user_b.id pour garantir
    l'unicité (une seule conversation par paire, peu importe l'ordre)."""
    user_a = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='conversations_as_a'
    )
    user_b = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='conversations_as_b'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user_a', 'user_b')

    @classmethod
    def get_or_create_between(cls, u1, u2):
        """Récupère (ou crée) la conversation entre deux utilisateurs."""
        low, high = sorted([u1, u2], key=lambda u: u.id)
        conv, _ = cls.objects.get_or_create(user_a=low, user_b=high)
        return conv

    def has_participant(self, user):
        return self.user_a_id == user.id or self.user_b_id == user.id

    def other_user(self, user):
        """Renvoie l'interlocuteur du point de vue de `user`."""
        return self.user_b if self.user_a_id == user.id else self.user_a

    def __str__(self):
        return f"DM {self.user_a} <-> {self.user_b}"


class DirectMessage(models.Model):
    """Message d'une conversation privée."""
    conversation = models.ForeignKey(
        Conversation, on_delete=models.CASCADE, related_name='messages'
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='direct_messages'
    )
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.sender} : {self.content[:50]}"
