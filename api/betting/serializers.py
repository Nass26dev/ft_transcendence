from decimal import Decimal

from django.db import transaction
from rest_framework import serializers

from sports.models import Match, Odds
from .models import Bet, BetSelection

# Mapping front (1 / X / 2) -> sélection Odds en base (market 1N2)
SELECTION_MAP = {"1": "home", "X": "draw", "2": "away"}

# Garde-fous des paris (monnaie virtuelle, mais on borne pour éviter les
# débordements de champ et le farming de Kops).
MAX_STAKE = Decimal("10000000")            # mise max par pari : 10 M Kops
MAX_COMBO_LEGS = 10                         # nombre max de matchs dans un combiné
MAX_ODD_VALUE = Decimal("9999999999.99")   # cote totale max (anti-overflow)
# Les paris en direct ferment en fin de rencontre : passé cette minute, le
# résultat est quasi acquis, on bloque comme le font les books.
LIVE_BET_CUTOFF_MINUTE = 85


def _pick_label(odd):
    """Libellé lisible d'une jambe à partir de sa cote."""
    match = odd.match
    return {
        "home": f"{match.home_team} vainqueur",
        "draw": "Match nul",
        "away": f"{match.away_team} vainqueur",
    }.get(odd.selection, odd.selection)


class SelectionInputSerializer(serializers.Serializer):
    """Une jambe en écriture : match + sélection (1/X/2)."""

    match = serializers.PrimaryKeyRelatedField(queryset=Match.objects.all())
    selection = serializers.ChoiceField(choices=list(SELECTION_MAP.keys()))


class BetSerializer(serializers.ModelSerializer):
    # Écriture : soit `selections` (liste, pour les combinés), soit le couple
    # `match` + `selection` (pari simple, rétro-compat).
    selections = SelectionInputSerializer(many=True, write_only=True, required=False)
    match = serializers.PrimaryKeyRelatedField(
        queryset=Match.objects.all(), write_only=True, required=False
    )
    selection = serializers.ChoiceField(
        choices=list(SELECTION_MAP.keys()), write_only=True, required=False
    )

    # Lecture : cote totale, gain potentiel, libellé du type et détail des jambes.
    odd_value = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )
    potential_win = serializers.SerializerMethodField()
    kind = serializers.SerializerMethodField()
    picks = serializers.SerializerMethodField()

    class Meta:
        model = Bet
        fields = [
            "id",
            "selections",
            "match",
            "selection",
            "stake",
            "odd_value",
            "potential_win",
            "kind",
            "picks",
            "status",
            "created_at",
            "settled_at",
        ]
        read_only_fields = ("status", "created_at", "settled_at")

    # ---------- Lecture ----------

    def get_potential_win(self, obj):
        return round(obj.stake * obj.odd_value, 2)

    def get_kind(self, obj):
        n = obj.selections.count()
        return "Simple" if n <= 1 else f"Combiné x{n}"

    def get_picks(self, obj):
        out = []
        for leg in obj.selections.select_related(
            "odd", "match__home_team", "match__away_team"
        ):
            out.append({
                "match": f"{leg.match.home_team} vs {leg.match.away_team}",
                "pick": _pick_label(leg.odd),
                "odd": float(leg.odd_value),
                "status": leg.status,
            })
        return out

    # ---------- Validation ----------

    def validate_stake(self, value):
        if value <= 0:
            raise serializers.ValidationError("La mise doit être positive.")
        if value > MAX_STAKE:
            raise serializers.ValidationError(
                f"Mise maximale : {int(MAX_STAKE):,} Kops.".replace(",", " ")
            )
        return value

    def validate(self, attrs):
        # Normalise l'entrée en une liste de jambes {match, selection}.
        raw = attrs.get("selections")
        if not raw:
            if attrs.get("match") is None or attrs.get("selection") is None:
                raise serializers.ValidationError(
                    "Fournis 'selections' (combiné) ou 'match' + 'selection' (simple)."
                )
            raw = [{"match": attrs["match"], "selection": attrs["selection"]}]

        if len(raw) > MAX_COMBO_LEGS:
            raise serializers.ValidationError(
                f"Un combiné ne peut pas dépasser {MAX_COMBO_LEGS} matchs."
            )

        match_ids = [leg["match"].id for leg in raw]
        if len(match_ids) != len(set(match_ids)):
            raise serializers.ValidationError(
                "Un combiné ne peut pas contenir deux fois le même match."
            )

        legs = []
        total_odd = Decimal("1")
        for leg in raw:
            match = leg["match"]
            # On parie sur les matchs à venir ET en cours ; fermé une fois
            # le match terminé ou annulé.
            if match.status not in ("scheduled", "live"):
                raise serializers.ValidationError(
                    f"Les paris sont fermés pour {match}."
                )
            # En direct, on ferme les paris en fin de match (résultat quasi
            # acquis) — comme sur les sites de paris.
            if (
                match.status == "live"
                and match.current_minute is not None
                and match.current_minute >= LIVE_BET_CUTOFF_MINUTE
            ):
                raise serializers.ValidationError(
                    f"Paris fermés : {match} touche à sa fin."
                )
            sel = SELECTION_MAP[leg["selection"]]
            try:
                odd = match.odds.get(market="1N2", selection=sel)
            except Odds.DoesNotExist:
                raise serializers.ValidationError(
                    f"Cote indisponible pour {match}."
                )
            legs.append((odd, odd.value))
            total_odd *= odd.value

        attrs["_legs"] = legs
        attrs["odd_value"] = round(total_odd, 2)  # cote totale figée
        if attrs["odd_value"] > MAX_ODD_VALUE:
            raise serializers.ValidationError(
                "Cote totale trop élevée pour ce combiné."
            )
        return attrs

    # ---------- Création ----------

    def create(self, validated_data):
        legs = validated_data["_legs"]
        odd_value = validated_data["odd_value"]
        stake = validated_data["stake"]
        user = validated_data.pop("user", None) or self.context["request"].user

        with transaction.atomic():
            locked = type(user).objects.select_for_update().get(pk=user.pk)
            if locked.wallet < stake:
                raise serializers.ValidationError({"stake": "Solde insuffisant."})
            locked.wallet -= stake
            locked.save(update_fields=["wallet"])

            bet = Bet.objects.create(user=user, stake=stake, odd_value=odd_value)
            BetSelection.objects.bulk_create([
                BetSelection(bet=bet, match=odd.match, odd=odd, odd_value=value)
                for odd, value in legs
            ])

        return bet
