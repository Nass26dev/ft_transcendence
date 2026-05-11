"""
matches/views.py
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

from .models import Match, Standing
from .serializers import MatchSerializer, StandingSerializer

VALID_COMPETITIONS = {"L1", "UCL", "PL", "LIGA", "BUN", "SA"}


# ------------------------------------------------------------------ #
#  GET /api/matches/                                                   #
#  Params optionnels :                                                 #
#    ?competition=L1,PL        filtre par ligue(s)                    #
#    ?status=soon              filtre soon | live | finished           #
#    ?limit=20                 limite le nombre de résultats           #
# ------------------------------------------------------------------ #
@api_view(["GET"])
@permission_classes([AllowAny])
def get_matches(request):
    qs = Match.objects.order_by("time")

    # Filtre compétition  ?competition=L1  ou  ?competition=L1,PL,UCL
    comp_param = request.query_params.get("competition")
    if comp_param:
        comps = [c.strip().upper() for c in comp_param.split(",")]
        invalid = [c for c in comps if c not in VALID_COMPETITIONS]
        if invalid:
            return Response(
                {"error": f"Compétition(s) invalide(s) : {invalid}. Valeurs acceptées : {sorted(VALID_COMPETITIONS)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        qs = qs.filter(competition__in=comps)

    # Filtre statut  ?status=soon
    status_param = request.query_params.get("status")
    if status_param:
        qs = qs.filter(status=status_param)

    # Limite  ?limit=10
    limit = request.query_params.get("limit")
    if limit:
        try:
            qs = qs[: int(limit)]
        except ValueError:
            pass

    serializer = MatchSerializer(qs, many=True)
    return Response(serializer.data)


# ------------------------------------------------------------------ #
#  GET /api/matches/live/                                              #
#  Retourne tous les matchs en cours (status=live)                    #
# ------------------------------------------------------------------ #
@api_view(["GET"])
@permission_classes([AllowAny])
def get_live_matches(request):
    qs = Match.objects.filter(status="live").order_by("time")
    serializer = MatchSerializer(qs, many=True)
    return Response(serializer.data)


# ------------------------------------------------------------------ #
#  GET /api/matches/<id>/                                              #
#  Détail d'un match                                                   #
# ------------------------------------------------------------------ #
@api_view(["GET"])
@permission_classes([AllowAny])
def get_match_detail(request, pk):
    try:
        match = Match.objects.get(pk=pk)
    except Match.DoesNotExist:
        return Response({"error": "Match introuvable"}, status=status.HTTP_404_NOT_FOUND)
    return Response(MatchSerializer(match).data)


# ------------------------------------------------------------------ #
#  GET /api/standings/                                                 #
#  Params optionnels :                                                 #
#    ?competition=L1           (obligatoire en pratique)              #
# ------------------------------------------------------------------ #
@api_view(["GET"])
@permission_classes([AllowAny])
def get_standings(request):
    comp_param = request.query_params.get("competition")
    if not comp_param:
        return Response(
            {"error": "Le paramètre ?competition= est requis. Ex: ?competition=L1"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    comp = comp_param.strip().upper()
    if comp not in VALID_COMPETITIONS:
        return Response(
            {"error": f"Compétition invalide. Valeurs acceptées : {sorted(VALID_COMPETITIONS)}"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    qs = Standing.objects.filter(competition=comp).order_by("rank")
    serializer = StandingSerializer(qs, many=True)
    return Response({"competition": comp, "standings": serializer.data})