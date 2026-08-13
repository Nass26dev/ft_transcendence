from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import serializers
from drf_spectacular.utils import extend_schema, inline_serializer

from . import services
from .models import Challenge


def _challenge_dict(challenge, state):
    return {
        "code": challenge.code,
        "kind": challenge.kind,
        "icon": challenge.icon,
        "title": challenge.title,
        "description": challenge.description,
        "reward": challenge.reward,
        **state,
    }


class _ChallengeItemSerializer(serializers.Serializer):
    """Sérialiseur interne (schéma OpenAPI uniquement) pour un défi + progression."""

    code = serializers.CharField()
    kind = serializers.CharField()
    icon = serializers.CharField()
    title = serializers.CharField()
    description = serializers.CharField()
    reward = serializers.IntegerField()
    progress = serializers.IntegerField()
    target = serializers.IntegerField()
    completed = serializers.BooleanField()
    claimed = serializers.BooleanField()


class ChallengeListView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Lister les défis actifs (quotidiens et saison) avec ma progression",
        description=(
            "Renvoie tous les defis actifs (`Challenge.active=True`) repartis en deux "
            "listes selon leur `kind` : `daily` (quotidiens) et `season` (de saison). "
            "Pour chaque defi, la progression de l'utilisateur courant est calculee via "
            "`services.challenge_state` (progres actuel, cible, statut termine/reclame)."
        ),
        tags=["Defis & Badges"],
        responses={
            200: inline_serializer(
                name="ChallengeListResponse",
                fields={
                    "daily": _ChallengeItemSerializer(many=True),
                    "season": _ChallengeItemSerializer(many=True),
                },
            )
        },
    )
    def get(self, request):
        daily, season = [], []
        for ch in Challenge.objects.filter(active=True):
            item = _challenge_dict(ch, services.challenge_state(request.user, ch))
            (daily if ch.kind == "daily" else season).append(item)
        return Response({"daily": daily, "season": season})


class ChallengeClaimView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Réclamer la récompense d'un défi terminé",
        description=(
            "Crédite le portefeuille de l'utilisateur avec la récompense du défi "
            "identifié par `code`, via `services.claim_challenge`. Renvoie 404 si le "
            "défi n'existe pas ou n'est plus actif, 400 si le défi n'est pas encore "
            "terminé (`not_completed`) ou si sa récompense a déjà été récupérée "
            "(`already_claimed`)."
        ),
        tags=["Defis & Badges"],
        request=None,
        responses={
            200: inline_serializer(
                name="ChallengeClaimResponse",
                fields={"wallet": serializers.DecimalField(max_digits=14, decimal_places=2)},
            ),
            400: inline_serializer(
                name="ChallengeClaimErrorResponse",
                fields={"error": serializers.CharField()},
            ),
            404: inline_serializer(
                name="ChallengeClaimNotFoundResponse",
                fields={"error": serializers.CharField()},
            ),
        },
    )
    def post(self, request, code):
        try:
            challenge = Challenge.objects.get(code=code, active=True)
        except Challenge.DoesNotExist:
            return Response({"error": "Défi introuvable."}, status=404)

        try:
            wallet = services.claim_challenge(request.user, challenge)
        except ValueError as exc:
            msg = {
                "not_completed": "Défi non terminé.",
                "already_claimed": "Récompense déjà récupérée.",
            }.get(str(exc), "Erreur.")
            return Response({"error": msg}, status=400)

        return Response({"wallet": wallet})


class BadgeListView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Lister tous les badges avec mon état de déblocage",
        description=(
            "Renvoie tous les badges du jeu avec, pour chacun, l'état de déblocage de "
            "l'utilisateur courant. `services.sync_badges` recalcule et met à jour ces "
            "déblocages avant de répondre, afin que la liste reflète immédiatement les "
            "critères remplis (`unlocked` et `unlocked_at` sont donc toujours à jour)."
        ),
        tags=["Defis & Badges"],
        responses={
            200: inline_serializer(
                name="BadgeListItem",
                fields={
                    "code": serializers.CharField(),
                    "emoji": serializers.CharField(),
                    "name": serializers.CharField(),
                    "description": serializers.CharField(),
                    "unlocked": serializers.BooleanField(),
                    "unlocked_at": serializers.DateTimeField(allow_null=True),
                },
                many=True,
            )
        },
    )
    def get(self, request):
        data = [
            {
                "code": b["badge"].code,
                "emoji": b["badge"].emoji,
                "name": b["badge"].name,
                "description": b["badge"].description,
                "unlocked": b["unlocked"],
                "unlocked_at": b["unlocked_at"],
            }
            for b in services.sync_badges(request.user)
        ]
        return Response(data)
