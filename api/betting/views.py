from datetime import timedelta

from django.db.models import Count
from django.utils import timezone
from rest_framework import viewsets, permissions
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Bet
from .serializers import BetSerializer


class BetViewSet(viewsets.ModelViewSet):

    serializer_class = BetSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            Bet.objects
            .filter(user=self.request.user)
            .select_related("match__home_team", "match__away_team", "odd")
            .order_by("-created_at")
        )


# Nombre minimal de paris distincts visé avant d'élargir la fenêtre, et
# nombre max de tendances renvoyées.
TRENDING_TARGET = 3
TRENDING_LIMIT = 5


def _pick_label(selection, home, away):
    return {
        "home": f"{home} vainqueur",
        "draw": "Match nul",
        "away": f"{away} vainqueur",
    }.get(selection, selection)


class TrendingBetsView(APIView):
    """Paris les plus pris récemment (« Tendances Kop »).

    Fenêtre glissante élargie automatiquement (1h → 24h → tout l'historique)
    tant qu'on n'a pas atteint TRENDING_TARGET paris distincts, pour ne jamais
    renvoyer une liste vide quand le volume est faible. Public (consultation).
    """

    permission_classes = [AllowAny]

    def get(self, request):
        now = timezone.now()
        windows = [("1h", timedelta(hours=1)), ("24h", timedelta(hours=24)), ("all", None)]

        chosen, rows, total = "all", [], 0
        for label, delta in windows:
            qs = Bet.objects.all()
            if delta is not None:
                qs = qs.filter(created_at__gte=now - delta)
            rows = list(
                qs.values(
                    "odd__selection", "odd__value", "match",
                    "match__home_team__name", "match__away_team__name",
                )
                .annotate(count=Count("id"))
                .order_by("-count")
            )
            chosen, total = label, qs.count()
            if len(rows) >= TRENDING_TARGET:
                break

        data = [
            {
                "match_id": r["match"],
                "label": _pick_label(
                    r["odd__selection"],
                    r["match__home_team__name"],
                    r["match__away_team__name"],
                ),
                "selection": r["odd__selection"],
                "count": r["count"],
                "share": round(r["count"] / total * 100) if total else 0,
                "odd": float(r["odd__value"]),
                "home_team": r["match__home_team__name"],
                "away_team": r["match__away_team__name"],
                "window": chosen,
            }
            for r in rows[:TRENDING_LIMIT]
        ]
        return Response(data)
