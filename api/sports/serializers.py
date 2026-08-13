from rest_framework import serializers
from .models import Match, MatchEvent, MatchLineup, Odds


class MatchListSerializer(serializers.ModelSerializer):
    """Vue liste d'un match : équipes, logos/couleurs, cotes 1N2 et « Confiance des Kopistes »."""

    competition = serializers.CharField(source="competition.name", read_only=True)
    home_team = serializers.StringRelatedField()
    away_team = serializers.StringRelatedField()
    home_team_logo = serializers.CharField(
        source="home_team.logo_url", read_only=True, allow_blank=True
    )
    away_team_logo = serializers.CharField(
        source="away_team.logo_url", read_only=True, allow_blank=True
    )
    home_team_color = serializers.CharField(
        source="home_team.color_primary", read_only=True, allow_blank=True
    )
    away_team_color = serializers.CharField(
        source="away_team.color_primary", read_only=True, allow_blank=True
    )
    odds = serializers.SerializerMethodField()
    conf = serializers.SerializerMethodField()
    bets_total = serializers.SerializerMethodField()

    class Meta:
        """home_team_logo/away_team_logo sont vides tant que la tâche périodique
        sports.fetch_logos ne les a pas trouvés (TheSportsDB) : le frontend
        retombe alors sur un visuel générique. home_team_color/away_team_color
        (couleur officielle du club, hex) servent de repli pour ce visuel
        générique tant que le vrai logo n'est pas trouvé, plutôt que le
        rouge/bleu domicile-extérieur par défaut.
        """

        model = Match
        fields = [
            "id", "competition", "home_team", "away_team",
            "home_team_logo", "away_team_logo", "home_team_color", "away_team_color",
            "kickoff_at", "status", "home_score", "away_score",
            "current_minute", "odds", "conf", "bets_total",
        ]

    def get_odds(self, obj) -> dict[str, float]:
        """Cotes 1N2 du match sous la forme {"1": ..., "X": ..., "2": ...}."""
        mapping = {"home": "1", "draw": "X", "away": "2"}
        result = {}
        for o in obj.odds.all():
            if o.market == "1N2" and o.selection in mapping:
                result[mapping[o.selection]] = float(o.value)
        return result

    def _bet_counts(self, obj):
        """Compteurs de paris (home, draw, away) : valeurs annotées par
        MatchViewSet.get_queryset(), 0 si l'objet n'a pas été annoté.
        """
        return (
            getattr(obj, "bets_home", 0) or 0,
            getattr(obj, "bets_draw", 0) or 0,
            getattr(obj, "bets_away", 0) or 0,
        )

    def get_bets_total(self, obj) -> int:
        """Nombre total de paris (toutes issues confondues) sur le match."""
        return sum(self._bet_counts(obj))

    def get_conf(self, obj) -> dict[str, int]:
        """Répartition des paris en pourcentages entiers par issue 1N2, sommant à 100
        (méthode du plus grand reste pour l'arrondi).
        """
        h, d, a = self._bet_counts(obj)
        total = h + d + a
        if total == 0:
            return {"1": 0, "X": 0, "2": 0}
        raw = {"1": h / total * 100, "X": d / total * 100, "2": a / total * 100}
        floored = {k: int(v) for k, v in raw.items()}
        remainder = 100 - sum(floored.values())
        order = sorted(raw, key=lambda k: raw[k] - floored[k], reverse=True)
        for k in order[:remainder]:
            floored[k] += 1
        return floored

class OddsSerializer(serializers.ModelSerializer):
    """Sérialise une cote (marché, sélection, valeur)."""

    class Meta:
        """Champs exposés pour une cote."""

        model = Odds
        fields = ["market", "selection", "value", "updated_at"]


class MatchEventSerializer(serializers.ModelSerializer):
    """Sérialise un événement de match (but, carton, remplacement)."""

    class Meta:
        """Champs exposés pour un événement de match."""

        model = MatchEvent
        fields = ["minute", "type", "team_side", "player", "player_out"]


class MatchLineupSerializer(serializers.ModelSerializer):
    """Sérialise un joueur d'une feuille de match."""

    class Meta:
        """Champs exposés pour un joueur de la composition."""

        model = MatchLineup
        fields = ["team_side", "role", "number", "player"]


class MatchDetailSerializer(MatchListSerializer):
    """Vue détaillée d'un match : méta foot-live + événements + compositions."""

    events = MatchEventSerializer(many=True, read_only=True)
    lineups = MatchLineupSerializer(many=True, read_only=True)

    class Meta(MatchListSerializer.Meta):
        """Ajoute les champs de détail foot-live aux champs de la vue liste."""

        fields = MatchListSerializer.Meta.fields + [
            "referee", "venue", "stage",
            "ht_home_score", "ht_away_score",
            "details_fetched_at", "events", "lineups",
        ]