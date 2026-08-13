from django.apps import AppConfig


class ChatConfig(AppConfig):
    """Configuration de l'application chat (chat de ligue + messages directs)."""
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'chat'
