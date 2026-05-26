from django.contrib.auth import get_user_model

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import League


User = get_user_model()


class CreateLeague(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        creator = request.user

        name = request.data.get("name")
        description = request.data.get("description", "")

        if not name:
            return Response(
                {"error": "On a besoin d'un nom de ligue"},
                status=status.HTTP_400_BAD_REQUEST
            )
        if not description:
            return Response(
                {"error": "Fais une petite description"},
                status=status.HTTP_400_BAD_REQUEST
            )
        if League.objects.filter(name=name).exists():
            return Response(
                {"error": "La ligue existe déjà"},
                status=status.HTTP_400_BAD_REQUEST
            )
        league = League.objects.create(
            name=name,
            description=description,
            creator=creator
        )
        league.members.add(creator)

        return Response(
            {
                "message": "Ligue créée avec succès",
                "league": {
                    "id": league.id,
                    "name": league.name,
                    "description": league.description,
                    "creator": creator.username,
                }
            },
            status=status.HTTP_201_CREATED
        )