# sports/serializers.py
from rest_framework import serializers
from .models import Match, Odds


class MatchListSerializer(serializers.ModelSerializer):
    competition = serializers.StringRelatedField()
    home_team = serializers.StringRelatedField()
    away_team = serializers.StringRelatedField()

    class Meta:
        model = Match
        fields = [
            "id", "competition", "home_team", "away_team",
            "kickoff_at", "status", "home_score", "away_score", "current_minute",
        ]

class OddsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Odds
        fields = ["market", "selection", "value", "updated_at"]