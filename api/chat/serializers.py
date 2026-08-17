from datetime import datetime

from rest_framework import serializers
from django.contrib.auth import get_user_model

from .models import Message, Conversation, DirectMessage

User = get_user_model()


class ChatUserSerializer(serializers.ModelSerializer):
    """Infos minimales d'un utilisateur pour l'affichage dans le chat."""
    avatar = serializers.ImageField(read_only=True)
    is_online = serializers.BooleanField(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'avatar', 'is_online']


class MessageSerializer(serializers.ModelSerializer):
    """Message d'un chat de ligue."""
    sender = ChatUserSerializer(read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'content', 'created_at', 'sender']


class DirectMessageSerializer(serializers.ModelSerializer):
    """Message d'une conversation privée."""
    sender = ChatUserSerializer(read_only=True)

    class Meta:
        model = DirectMessage
        fields = ['id', 'content', 'created_at', 'sender']


class ConversationSerializer(serializers.ModelSerializer):
    """Conversation DM vue par l'utilisateur courant : interlocuteur + dernier message."""
    peer = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    last_message_at = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ['id', 'peer', 'last_message', 'last_message_at']

    def _me(self):
        """Renvoie l'utilisateur courant depuis le contexte de la requête."""
        return self.context['request'].user

    def get_peer(self, obj) -> dict:
        """Sérialise l'interlocuteur, en propageant le contexte (request) pour que l'URL de l'avatar soit absolue."""
        return ChatUserSerializer(obj.other_user(self._me()), context=self.context).data

    def get_last_message(self, obj) -> str | None:
        """Renvoie le contenu du dernier message de la conversation, ou None s'il n'y en a aucun."""
        last = obj.messages.order_by('-created_at').first()
        return last.content if last else None

    def get_last_message_at(self, obj) -> datetime:
        """Renvoie la date du dernier message, ou la date de création de la conversation à défaut."""
        last = obj.messages.order_by('-created_at').first()
        return last.created_at if last else obj.created_at
