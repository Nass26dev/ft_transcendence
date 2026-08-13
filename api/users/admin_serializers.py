from rest_framework import serializers
from .models import User
from betting.models import Bet, BetSelection


class FriendSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email"]


class BetSelectionAdminSerializer(serializers.ModelSerializer):
    match = serializers.StringRelatedField()
    odd = serializers.StringRelatedField()

    class Meta:
        model = BetSelection
        fields = ["id", "match", "odd", "odd_value", "status"]


class BetAdminSerializer(serializers.ModelSerializer):
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
        return round(float(obj.stake) * float(obj.odd_value), 2)


class UserAdminListSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "status", "wallet"]


class UserAdminDetailSerializer(serializers.ModelSerializer):
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
        from friends.models import Friendship
        # Récupère tous les users avec qui il a une amitié acceptée
        sent = Friendship.objects.filter(sender=obj, status="accepted").values_list("receiver", flat=True)
        received = Friendship.objects.filter(receiver=obj, status="accepted").values_list("sender", flat=True)
        friend_ids = list(sent) + list(received)
        friends = User.objects.filter(id__in=friend_ids)
        return FriendSerializer(friends, many=True).data

    def get_bets(self, obj) -> list:
        bets = Bet.objects.filter(user=obj).prefetch_related("selections").order_by("-created_at")
        return BetAdminSerializer(bets, many=True).data


class UserAdminUpdateSerializer(serializers.ModelSerializer):
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
        qs = User.objects.filter(email=value).exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Cet email est déjà utilisé.")
        return value

    def validate_username(self, value):
        qs = User.objects.filter(username=value).exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Ce nom d'utilisateur est déjà pris.")
        return value

    def validate_status(self, value):
        if value not in ["user", "admin", "owner"]:
            raise serializers.ValidationError("Statut invalide.")
        return value


class WalletUpdateSerializer(serializers.Serializer):
    wallet = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0)