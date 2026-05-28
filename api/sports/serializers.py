# sports/serializers.py
from rest_framework import serializers
from .models import Match, Odds


class MatchListSerializer(serializers.ModelSerializer):
    competition = serializers.CharField(source="competition.name", read_only=True)
    home_team = serializers.StringRelatedField()
    away_team = serializers.StringRelatedField()
    odds = serializers.SerializerMethodField()

    class Meta:
        model = Match
        fields = [
            "id", "competition", "home_team", "away_team",
            "kickoff_at", "status", "home_score", "away_score",
            "current_minute", "odds",
        ]

    def get_odds(self, obj):
        mapping = {"home": "1", "draw": "X", "away": "2"}
        result = {}
        for o in obj.odds.all():
            if o.market == "1N2" and o.selection in mapping:
                result[mapping[o.selection]] = float(o.value)
        return result

class OddsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Odds
        fields = ["market", "selection", "value", "updated_at"]