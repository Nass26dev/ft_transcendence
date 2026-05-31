from django.db import transaction
from rest_framework import serializers

from sports.models import Match, Odds
from .models import Bet

# Mapping front (1 / X / 2) -> sélection Odds en base (market 1N2)
SELECTION_MAP = {"1": "home", "X": "draw", "2": "away"}


class BetSerializer(serializers.ModelSerializer):
    # En écriture : le front envoie le match, la sélection (1/X/2) et la mise.
    match = serializers.PrimaryKeyRelatedField(queryset=Match.objects.all())
    selection = serializers.ChoiceField(
        choices=list(SELECTION_MAP.keys()), write_only=True
    )

    # En lecture : on expose la cote figée, le gain potentiel et un libellé.
    odd_value = serializers.DecimalField(
        max_digits=6, decimal_places=2, read_only=True
    )
    potential_win = serializers.SerializerMethodField()
    pick = serializers.SerializerMethodField()
    home_team = serializers.StringRelatedField(source="match.home_team", read_only=True)
    away_team = serializers.StringRelatedField(source="match.away_team", read_only=True)

    class Meta:
        model = Bet
        fields = [
            "id",
            "match",
            "selection",
            "stake",
            "odd",
            "odd_value",
            "potential_win",
            "pick",
            "home_team",
            "away_team",
            "status",
            "created_at",
            "settled_at",
        ]
        read_only_fields = ("odd", "status", "created_at", "settled_at")

    def get_potential_win(self, obj):
        return round(obj.stake * obj.odd_value, 2)

    def get_pick(self, obj):
        # Libellé lisible de la sélection à partir de la cote prise.
        labels = {
            "home": f"{obj.match.home_team} vainqueur",
            "draw": "Match nul",
            "away": f"{obj.match.away_team} vainqueur",
        }
        return labels.get(obj.odd.selection, obj.odd.selection)

    def validate_stake(self, value):
        if value <= 0:
            raise serializers.ValidationError("La mise doit être positive.")
        return value

    def validate(self, attrs):
        match = attrs["match"]
        if match.status != "scheduled":
            raise serializers.ValidationError(
                "Les paris sont fermés pour ce match."
            )
        selection = SELECTION_MAP[attrs["selection"]]
        try:
            odd = match.odds.get(market="1N2", selection=selection)
        except Odds.DoesNotExist:
            raise serializers.ValidationError(
                "Cote indisponible pour cette sélection."
            )
        attrs["odd"] = odd
        attrs["odd_value"] = odd.value  # fige la cote au moment du pari
        return attrs

    def create(self, validated_data):
        validated_data.pop("selection", None)
        # user peut venir de perform_create (save(user=...)) ou du contexte.
        user = validated_data.pop("user", None) or self.context["request"].user
        stake = validated_data["stake"]

        with transaction.atomic():
            locked = type(user).objects.select_for_update().get(pk=user.pk)
            if locked.wallet < stake:
                raise serializers.ValidationError({"stake": "Solde insuffisant."})
            locked.wallet -= stake
            locked.save(update_fields=["wallet"])
            bet = Bet.objects.create(user=user, **validated_data)

        return bet
