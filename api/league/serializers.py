from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import League, LeagueInvitation

User = get_user_model()


class LeagueSerializer(serializers.ModelSerializer):
    """Représentation d'une ligue : nom, description, créateur et effectif."""

    creator = serializers.CharField(source="creator.username", read_only=True)
    members_count = serializers.SerializerMethodField()

    class Meta:
        model = League
        fields = ["id", "name", "description", "creator", "members_count"]

    def get_members_count(self, obj) -> int:
        """Nombre de membres de la ligue."""
        return obj.members.count()

class LeagueInvitationSerializer(serializers.ModelSerializer):
    """Représentation minimale d'une invitation de ligue reçue."""

    sender = serializers.CharField(source="sender.username")
    league = serializers.CharField(source="league.name")

    class Meta:
        model = LeagueInvitation
        fields = ["id", "sender", "league"]

class UserMiniSerializer(serializers.ModelSerializer):
    """Représentation minimale d'un utilisateur (id + username)."""

    class Meta:
        model = User
        fields = ["id", "username"]