from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

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


class ChallengeListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        daily, season = [], []
        for ch in Challenge.objects.filter(active=True):
            item = _challenge_dict(ch, services.challenge_state(request.user, ch))
            (daily if ch.kind == "daily" else season).append(item)
        return Response({"daily": daily, "season": season})


class ChallengeClaimView(APIView):
    permission_classes = [IsAuthenticated]

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
