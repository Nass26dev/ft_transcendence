"""
matches/serializers.py
"""

from rest_framework import serializers
from .models import Match, Standing


class MatchSerializer(serializers.ModelSerializer):
    odds = serializers.SerializerMethodField()
    conf = serializers.SerializerMethodField()
    kickoff = serializers.SerializerMethodField()

    class Meta:
        model = Match
        fields = [
            "id",
            "competition",
            "home_team",
            "away_team",
            "home_team_crest",
            "away_team_crest",
            "kickoff",
            "time",
            "status",
            "minute",
            "home_score",
            "away_score",
            "odds",
            "conf",
        ]

    def get_kickoff(self, obj) -> str:
        """Retourne ex: 'Sam 21:00' comme dans les mocks front."""
        if not obj.time:
            return ""
        DAYS = {0: "Lun", 1: "Mar", 2: "Mer", 3: "Jeu", 4: "Ven", 5: "Sam", 6: "Dim"}
        day = DAYS[obj.time.weekday()]
        return f"{day} {obj.time.strftime('%H:%M')}"

    def get_odds(self, obj) -> dict | None:
        if obj.odd_home is None:
            return None
        return {
            "1": float(obj.odd_home),
            "X": float(obj.odd_draw),
            "2": float(obj.odd_away),
        }

    def get_conf(self, obj) -> dict | None:
        if obj.conf_home is None:
            return None
        return {
            "1": obj.conf_home,
            "X": obj.conf_draw,
            "2": obj.conf_away,
        }


class StandingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Standing
        fields = [
            "rank",
            "team_name",
            "played",
            "wins",
            "draws",
            "losses",
            "goals_for",
            "goals_against",
            "goal_diff",
            "points",
        ]