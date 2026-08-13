from rest_framework import serializers
from .models import User
from betting.models import Bet, BetSelection


class FriendSerializer(serializers.ModelSerializer):
    """Représentation minimale d'un utilisateur dans une liste d'amis."""

    class Meta:
        model = User
        fields = ["id", "username", "email"]


class BetSelectionAdminSerializer(serializers.ModelSerializer):
    """Sélection d'un pari, vue admin (match et cote affichés en texte)."""

    match = serializers.StringRelatedField()
    odd = serializers.StringRelatedField()

    class Meta:
        model = BetSelection
        fields = ["id", "match", "odd", "odd_value", "status"]


class BetAdminSerializer(serializers.ModelSerializer):
    """Pari complet avec ses sélections, vue admin."""

    selections = BetSelectionAdminSerializer(many=True, read_only=True)
    potential_win = serializers.SerializerMethodField()

    class Meta:
        model = Bet
        fields = [
            "id",
            "stake",
            "odd_value",
            "status",
            "created_at",
            "settled_at",
            "selections",
            "potential_win",
        ]

    def get_potential_win(self, obj):
        """Gain potentiel du pari (mise × cote), arrondi à 2 décimales."""
        return round(float(obj.stake) * float(obj.odd_value), 2)


class UserAdminListSerializer(serializers.ModelSerializer):
    """Représentation condensée d'un utilisateur pour les listes admin."""

    class Meta:
        model = User
        fields = ["id", "username", "email", "status", "wallet"]


class UserAdminDetailSerializer(serializers.ModelSerializer):
    """Profil complet d'un utilisateur, avec ses amis et ses paris, pour la vue admin."""

    friends = serializers.SerializerMethodField()
    bets = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "status",
            "wallet",
            "bio",
            "onboarding_completed",
            "last_daily_bonus",
            "friends",
            "bets",
        ]

    def get_friends(self, obj) -> list:
        """Récupère tous les users avec qui il a une amitié acceptée (dans les deux sens)."""
        from friends.models import Friendship
        sent = Friendship.objects.filter(sender=obj, status="accepted").values_list("receiver", flat=True)
        received = Friendship.objects.filter(receiver=obj, status="accepted").values_list("sender", flat=True)
        friend_ids = list(sent) + list(received)
        friends = User.objects.filter(id__in=friend_ids)
        return FriendSerializer(friends, many=True).data

    def get_bets(self, obj) -> list:
        """Historique des paris de l'utilisateur, du plus récent au plus ancien."""
        bets = Bet.objects.filter(user=obj).prefetch_related("selections").order_by("-created_at")
        return BetAdminSerializer(bets, many=True).data


class UserAdminUpdateSerializer(serializers.ModelSerializer):
    """Champs qu'un admin/owner peut modifier sur un utilisateur."""

    class Meta:
        model = User
        fields = ["username", "email", "bio", "status"]
        extra_kwargs = {
            "username": {"required": False},
            "email": {"required": False},
            "bio": {"required": False},
            "status": {"required": False},
        }

    def validate_email(self, value):
        """Rejette l'email s'il est déjà utilisé par un autre utilisateur."""
        qs = User.objects.filter(email=value).exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Cet email est déjà utilisé.")
        return value

    def validate_username(self, value):
        """Rejette le nom d'utilisateur s'il est déjà pris par un autre utilisateur."""
        qs = User.objects.filter(username=value).exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Ce nom d'utilisateur est déjà pris.")
        return value

    def validate_status(self, value):
        """Rejette toute valeur de statut hors de l'ensemble autorisé."""
        if value not in ["user", "admin", "owner"]:
            raise serializers.ValidationError("Statut invalide.")
        return value


class WalletUpdateSerializer(serializers.Serializer):
    """Payload de mise à jour du solde (wallet) d'un utilisateur par un admin."""

    wallet = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0)