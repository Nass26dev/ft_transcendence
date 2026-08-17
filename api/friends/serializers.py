from rest_framework import serializers
from .models import Friendship
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSummarySerializer(serializers.ModelSerializer):
    """Infos minimales d'un utilisateur pour l'affichage dans les listes d'amis."""
    
    is_online = serializers.BooleanField(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'avatar', 'bio', 'is_online', 'last_seen']


class FriendshipSerializer(serializers.ModelSerializer):
    """Relation d'amitié (ou demande) avec les deux utilisateurs sérialisés."""
    sender = UserSummarySerializer(read_only=True)
    receiver = UserSummarySerializer(read_only=True)

    class Meta:
        model = Friendship
        fields = ['id', 'sender', 'receiver', 'status', 'created_at']