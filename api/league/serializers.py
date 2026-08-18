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


class LeagueUpdateSerializer(serializers.ModelSerializer):
    """Champs qu'un créateur peut modifier sur sa ligue.

    Volontairement limité au nom et à la description : `creator` et `members`
    ne doivent jamais être réassignés par une simple mise à jour : on ne change
    pas de propriétaire ni d'effectif via PATCH, mais via les routes dédiées
    (invitation, kick, leave).
    """

    class Meta:
        model = League
        fields = ["name", "description"]
        extra_kwargs = {
            "name": {"required": False},
            "description": {"required": False},
        }

    def validate_name(self, value):
        """Rejette un nom vide ou déjà porté par une autre ligue."""
        value = (value or "").strip()
        if not value:
            raise serializers.ValidationError("Le nom de la ligue ne peut pas être vide.")
        if League.objects.filter(name=value).exclude(pk=self.instance.pk).exists():
            raise serializers.ValidationError("Ce nom de ligue est déjà pris.")
        return value

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