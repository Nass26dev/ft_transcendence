from rest_framework import serializers
from django.contrib.auth import get_user_model

from .models import Message, Conversation, DirectMessage

User = get_user_model()


class ChatUserSerializer(serializers.ModelSerializer):
    """Infos minimales d'un utilisateur pour l'affichage dans le chat."""
    avatar = serializers.ImageField(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'avatar']


class MessageSerializer(serializers.ModelSerializer):
    """Message d'un chat de ligue."""
    sender = ChatUserSerializer(read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'content', 'created_at', 'sender']


class DirectMessageSerializer(serializers.ModelSerializer):
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
        return self.context['request'].user

    def get_peer(self, obj):
        # Propage le contexte (request) pour que l'URL de l'avatar soit absolue.
        return ChatUserSerializer(obj.other_user(self._me()), context=self.context).data

    def get_last_message(self, obj):
        last = obj.messages.order_by('-created_at').first()
        return last.content if last else None

    def get_last_message_at(self, obj):
        last = obj.messages.order_by('-created_at').first()
        return last.created_at if last else obj.created_at
