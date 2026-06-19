# sports/serializers.py
from rest_framework import serializers
from .models import Match, MatchEvent, MatchLineup, Odds


class MatchListSerializer(serializers.ModelSerializer):
    competition = serializers.CharField(source="competition.name", read_only=True)
    home_team = serializers.StringRelatedField()
    away_team = serializers.StringRelatedField()
    odds = serializers.SerializerMethodField()
    conf = serializers.SerializerMethodField()
    bets_total = serializers.SerializerMethodField()

    class Meta:
        model = Match
        fields = [
            "id", "competition", "home_team", "away_team",
            "kickoff_at", "status", "home_score", "away_score",
            "current_minute", "odds", "conf", "bets_total",
        ]

    def get_odds(self, obj):
        mapping = {"home": "1", "draw": "X", "away": "2"}
        result = {}
        for o in obj.odds.all():
            if o.market == "1N2" and o.selection in mapping:
                result[mapping[o.selection]] = float(o.value)
        return result

    def _bet_counts(self, obj):
        # Valeurs annotées par MatchViewSet.get_queryset() ; 0 si non annoté.
        return (
            getattr(obj, "bets_home", 0) or 0,
            getattr(obj, "bets_draw", 0) or 0,
            getattr(obj, "bets_away", 0) or 0,
        )

    def get_bets_total(self, obj):
        return sum(self._bet_counts(obj))

    def get_conf(self, obj):
        h, d, a = self._bet_counts(obj)
        total = h + d + a
        if total == 0:
            return {"1": 0, "X": 0, "2": 0}
        # Pourcentages entiers sommant 100 (méthode du plus grand reste).
        raw = {"1": h / total * 100, "X": d / total * 100, "2": a / total * 100}
        floored = {k: int(v) for k, v in raw.items()}
        remainder = 100 - sum(floored.values())
        order = sorted(raw, key=lambda k: raw[k] - floored[k], reverse=True)
        for k in order[:remainder]:
            floored[k] += 1
        return floored

class OddsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Odds
        fields = ["market", "selection", "value", "updated_at"]


class MatchEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = MatchEvent
        fields = ["minute", "type", "team_side", "player", "player_out"]


class MatchLineupSerializer(serializers.ModelSerializer):
    class Meta:
        model = MatchLineup
        fields = ["team_side", "role", "number", "player"]


class MatchDetailSerializer(MatchListSerializer):
    """Vue détaillée d'un match : méta foot-live + événements + compositions."""

    events = MatchEventSerializer(many=True, read_only=True)
    lineups = MatchLineupSerializer(many=True, read_only=True)

    class Meta(MatchListSerializer.Meta):
        fields = MatchListSerializer.Meta.fields + [
            "referee", "venue", "stage",
            "ht_home_score", "ht_away_score",
            "details_fetched_at", "events", "lineups",
        ]