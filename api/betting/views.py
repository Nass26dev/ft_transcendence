from datetime import timedelta

from django.db.models import Count, Sum, F, Q, Case, When, Value, DecimalField
from django.utils import timezone
from rest_framework import viewsets, permissions
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from friends.models import Friendship

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


# Nombre max d'entrées renvoyées dans le classement.
LEADERBOARD_LIMIT = 50

# Fenêtre temporelle par période. "season" est mappé sur tout l'historique
# (pas de notion de saison côté backend pour l'instant).
PERIOD_DELTAS = {
    "week": timedelta(days=7),
    "month": timedelta(days=30),
    "season": None,
    "all": None,
}


def _profit_expr():
    """Bénéfice net d'un pari : gain net si gagné, mise perdue si perdu."""
    return Case(
        When(status="won", then=F("stake") * (F("odd_value") - Value(1))),
        When(status="lost", then=-F("stake")),
        default=Value(0),
        output_field=DecimalField(max_digits=14, decimal_places=2),
    )


class LeaderboardView(APIView):
    """Classement des joueurs par gains nets, filtrable par période et portée.

    - period : week | month | season | all (season = tous temps).
    - scope  : world (tous les joueurs) | friends (amis acceptés + soi-même).

    Le score est le bénéfice net (gains des paris gagnés − mises perdues) sur
    la période. Seuls les paris réglés (won/lost) comptent. Public.
    """

    permission_classes = [AllowAny]

    def get(self, request):
        period = request.query_params.get("period", "week")
        scope = request.query_params.get("scope", "world")
        now = timezone.now()
        me_id = request.user.id if request.user.is_authenticated else None

        # Portée "amis" : impossible sans être connecté.
        friend_ids = None
        if scope == "friends":
            if not me_id:
                return Response({"period": period, "scope": scope, "entries": []})
            friend_ids = {me_id}
            pairs = (
                Friendship.objects.filter(status="accepted")
                .filter(Q(sender_id=me_id) | Q(receiver_id=me_id))
                .values_list("sender_id", "receiver_id")
            )
            for s_id, r_id in pairs:
                friend_ids.add(s_id)
                friend_ids.add(r_id)

        def scoped(qs):
            return qs.filter(user_id__in=friend_ids) if friend_ids is not None else qs

        # Classement sur la période demandée.
        qs = scoped(Bet.objects.filter(status__in=["won", "lost"]))
        delta = PERIOD_DELTAS.get(period)
        if delta is not None:
            qs = qs.filter(created_at__gte=now - delta)

        rows = list(
            qs.values("user_id", "user__username")
            .annotate(
                net=Sum(_profit_expr()),
                won=Count("id", filter=Q(status="won")),
                settled=Count("id"),
            )
            .order_by("-net")[:LEADERBOARD_LIMIT]
        )

        # Variation sur 7 jours glissants (même portée), pour la colonne "cette sem.".
        week_qs = scoped(
            Bet.objects.filter(
                status__in=["won", "lost"], created_at__gte=now - timedelta(days=7)
            )
        )
        week_net = {
            r["user_id"]: r["net"]
            for r in week_qs.values("user_id").annotate(net=Sum(_profit_expr()))
        }

        entries = []
        for i, r in enumerate(rows, start=1):
            settled = r["settled"] or 0
            entries.append(
                {
                    "rank": i,
                    "user_id": r["user_id"],
                    "username": r["user__username"],
                    "net": round(float(r["net"] or 0), 2),
                    "week_net": round(float(week_net.get(r["user_id"], 0) or 0), 2),
                    "win_rate": round(r["won"] / settled * 100) if settled else 0,
                    "bets": settled,
                    "me": r["user_id"] == me_id,
                }
            )

        return Response({"period": period, "scope": scope, "entries": entries})
