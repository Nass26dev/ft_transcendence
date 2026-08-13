from datetime import timedelta

from django.db.models import Count, Sum, F, Q, Case, When, Value, DecimalField
from django.utils import timezone
from rest_framework import viewsets, permissions, serializers
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import (
    extend_schema,
    extend_schema_view,
    inline_serializer,
    OpenApiParameter,
)

from friends.models import Friendship

from .models import Bet, BetSelection
from .serializers import BetSerializer


@extend_schema_view(
    list=extend_schema(
        tags=["Paris"],
        description=(
            "Liste les paris de l'utilisateur authentifié uniquement (`Bet.objects."
            "filter(user=request.user)`), triés du plus récent au plus ancien, avec "
            "les sélections, cotes et matchs associés préchargés."
        ),
    ),
    retrieve=extend_schema(
        tags=["Paris"],
        description=(
            "Détail d'un pari appartenant à l'utilisateur authentifié. Renvoie 404 si "
            "le pari n'existe pas ou appartient à un autre utilisateur."
        ),
    ),
    create=extend_schema(
        tags=["Paris"],
        description=(
            "Crée un nouveau pari (simple ou combiné) pour l'utilisateur authentifié, "
            "avec ses sélections de cotes. Le pari est automatiquement rattaché à "
            "l'utilisateur courant, qui ne peut pas parier au nom d'un autre."
        ),
    ),
    update=extend_schema(
        tags=["Paris"],
        description=(
            "Remplace intégralement un pari existant de l'utilisateur authentifié. "
            "Renvoie 404 si le pari n'appartient pas à l'utilisateur courant."
        ),
    ),
    partial_update=extend_schema(
        tags=["Paris"],
        description=(
            "Met à jour partiellement un pari existant de l'utilisateur authentifié. "
            "Renvoie 404 si le pari n'appartient pas à l'utilisateur courant."
        ),
    ),
    destroy=extend_schema(
        tags=["Paris"],
        description=(
            "Supprime un pari appartenant à l'utilisateur authentifié. Renvoie 404 si "
            "le pari n'appartient pas à l'utilisateur courant."
        ),
    ),
)
class BetViewSet(viewsets.ModelViewSet):
    """CRUD des paris de l'utilisateur connecté.

    `queryset` n'est utilisé que pour permettre à drf-spectacular d'inférer
    le type du paramètre d'URL "id" sans avoir à exécuter get_queryset()
    (qui dépend de request.user).
    """

    serializer_class = BetSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Bet.objects.all()

    def get_queryset(self):
        """Paris de l'utilisateur connecté, avec sélections/cotes/matchs préchargés."""
        return (
            Bet.objects
            .filter(user=self.request.user)
            .prefetch_related(
                "selections__odd",
                "selections__match__home_team",
                "selections__match__away_team",
            )
            .order_by("-created_at")
        )


TRENDING_TARGET = 3
TRENDING_LIMIT = 5


def _pick_label(selection, home, away):
    """Libellé lisible d'une issue 1N2 à partir des noms d'équipes."""
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

    @extend_schema(
        summary="Paris les plus pris récemment (Tendances Kop)",
        description=(
            "Regroupe les sélections de paris (BetSelection) par match et par issue "
            "1N2, et renvoie les combinaisons les plus prises. La fenêtre temporelle "
            "s'élargit automatiquement (1h puis 24h puis tout l'historique) tant que "
            "moins de {target} combinaisons distinctes sont trouvées, afin de ne "
            "jamais renvoyer une liste vide quand le volume de paris est faible. "
            "Limité à {limit} entrées. Endpoint public, aucune authentification "
            "requise.".format(target=TRENDING_TARGET, limit=TRENDING_LIMIT)
        ),
        tags=["Paris"],
        responses={
            200: inline_serializer(
                name="TrendingBetsResponseItem",
                fields={
                    "match_id": serializers.IntegerField(),
                    "label": serializers.CharField(),
                    "selection": serializers.CharField(),
                    "count": serializers.IntegerField(),
                    "share": serializers.IntegerField(),
                    "odd": serializers.FloatField(),
                    "home_team": serializers.CharField(),
                    "away_team": serializers.CharField(),
                    "window": serializers.CharField(),
                },
                many=True,
            )
        },
    )
    def get(self, request):
        """Renvoie les tendances, en élargissant la fenêtre jusqu'à réunir au
        moins TRENDING_TARGET combinaisons distinctes. Compte par jambe
        (BetSelection), combinés inclus.
        """
        now = timezone.now()
        windows = [("1h", timedelta(hours=1)), ("24h", timedelta(hours=24)), ("all", None)]

        chosen, rows, total = "all", [], 0
        for label, delta in windows:
            qs = BetSelection.objects.all()
            if delta is not None:
                qs = qs.filter(bet__created_at__gte=now - delta)
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


LEADERBOARD_LIMIT = 50

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

    @extend_schema(
        summary="Classement des joueurs par gains nets",
        description=(
            "Classe les joueurs selon leur bénéfice net (gains des paris gagnés moins "
            "mises des paris perdus) : seuls les paris réglés (`status` = `won` ou "
            "`lost`) sont comptabilisés. Le paramètre `period` restreint le calcul à "
            "une fenêtre glissante (`week` = 7 jours, `month` = 30 jours, `season`/"
            "`all` = tout l'historique). Le paramètre `scope` limite le classement aux "
            "amis acceptés de l'utilisateur courant (plus lui-même) si `friends`, sinon "
            "à tous les joueurs au profil public. Une colonne `week_net` (variation sur "
            "7 jours glissants) est toujours calculée en plus, quelle que soit la "
            "`period` choisie. Limité aux {limit} premiers. Endpoint public ; `scope="
            "friends` renvoie une liste vide si l'utilisateur n'est pas authentifié."
            .format(limit=LEADERBOARD_LIMIT)
        ),
        tags=["Paris"],
        parameters=[
            OpenApiParameter(
                name="period",
                type=str,
                location=OpenApiParameter.QUERY,
                required=False,
                enum=["week", "month", "season", "all"],
                default="week",
                description="Fenêtre temporelle du classement (season = tous temps).",
            ),
            OpenApiParameter(
                name="scope",
                type=str,
                location=OpenApiParameter.QUERY,
                required=False,
                enum=["world", "friends"],
                default="world",
                description="Portée du classement : tous les joueurs, ou amis acceptés + soi-même.",
            ),
        ],
        responses={
            200: inline_serializer(
                name="LeaderboardResponse",
                fields={
                    "period": serializers.CharField(),
                    "scope": serializers.CharField(),
                    "entries": inline_serializer(
                        name="LeaderboardEntry",
                        fields={
                            "rank": serializers.IntegerField(),
                            "user_id": serializers.IntegerField(),
                            "username": serializers.CharField(),
                            "net": serializers.FloatField(),
                            "week_net": serializers.FloatField(),
                            "win_rate": serializers.IntegerField(),
                            "bets": serializers.IntegerField(),
                            "me": serializers.BooleanField(),
                        },
                        many=True,
                    ),
                },
            )
        },
    )
    def get(self, request):
        """Restreint le queryset (amis ou monde), calcule le net sur la
        période choisie puis la variation à 7 jours glissants pour l'affichage.
        """
        period = request.query_params.get("period", "week")
        scope = request.query_params.get("scope", "world")
        now = timezone.now()
        me_id = request.user.id if request.user.is_authenticated else None

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
            """Restreint aux profils publics, et si `scope=friends`, aux amis
            acceptés + soi-même.
            """
            qs = qs.filter(user__is_public=True)
            return qs.filter(user_id__in=friend_ids) if friend_ids is not None else qs

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
