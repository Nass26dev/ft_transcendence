from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, serializers
from rest_framework.permissions import IsAuthenticated
from rest_framework.generics import get_object_or_404
from django.db.models import Q
from django.contrib.auth import get_user_model
from drf_spectacular.utils import extend_schema, inline_serializer

from league.models import League
from .models import Message, Conversation, DirectMessage
from .serializers import (
    MessageSerializer,
    ConversationSerializer,
    DirectMessageSerializer,
)

User = get_user_model()


class LeagueMessageHistory(APIView):
    """GET /api/chat/leagues/<league_id>/messages/ — 50 derniers messages d'une ligue."""
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Historique des messages d'une ligue",
        description=(
            "Renvoie les 50 derniers messages du chat de la ligue, du plus ancien au plus "
            "recent. Reserve aux membres de la ligue : renvoie 403 si l'utilisateur "
            "authentifie n'appartient pas a `league.members`. Renvoie 404 si la ligue "
            "n'existe pas."
        ),
        tags=["Chat"],
        responses={200: MessageSerializer(many=True)},
    )
    def get(self, request, league_id):
        league = get_object_or_404(League, id=league_id)
        if not league.members.filter(id=request.user.id).exists():
            return Response(
                {"detail": "Vous n'êtes pas membre de cette ligue."},
                status=status.HTTP_403_FORBIDDEN,
            )
        messages = (
            Message.objects
            .filter(league_id=league_id)
            .select_related("sender")
            .order_by("created_at")[:50]
        )
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ConversationList(APIView):
    """GET  /api/chat/conversations/         — liste mes conversations DM.
    POST /api/chat/conversations/  {user_id} — récupère/crée une conversation."""
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Lister mes conversations privées",
        description=(
            "Liste toutes les conversations directes (DM) ou l'utilisateur courant est "
            "`user_a` ou `user_b`. Le tri se fait par date du dernier message envoye dans "
            "chaque conversation (la plus recente en premier) ; une conversation sans "
            "message utilise sa date de creation comme repere."
        ),
        tags=["Chat"],
        responses={200: ConversationSerializer(many=True)},
    )
    def get(self, request):
        user = request.user
        convs = (
            Conversation.objects
            .filter(Q(user_a=user) | Q(user_b=user))
            .select_related("user_a", "user_b")
        )
        # Tri par date du dernier message (les plus récentes en premier).
        convs = sorted(
            convs,
            key=lambda c: (c.messages.order_by("-created_at").values_list("created_at", flat=True).first() or c.created_at),
            reverse=True,
        )
        serializer = ConversationSerializer(convs, many=True, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(
        summary="Récupérer ou créer une conversation avec un autre utilisateur",
        description=(
            "Renvoie la conversation existante entre l'utilisateur courant et `user_id`, "
            "ou la cree si elle n'existe pas encore (`Conversation.get_or_create_between`). "
            "Refuse (400) l'absence de `user_id` ou une tentative de conversation avec "
            "soi-meme. Renvoie 404 si l'utilisateur cible n'existe pas."
        ),
        tags=["Chat"],
        request=inline_serializer(
            name="ConversationListRequest",
            fields={"user_id": serializers.IntegerField()},
        ),
        responses={200: ConversationSerializer},
    )
    def post(self, request):
        user_id = request.data.get("user_id")
        if not user_id:
            return Response({"detail": "user_id requis."}, status=status.HTTP_400_BAD_REQUEST)
        if str(user_id) == str(request.user.id):
            return Response(
                {"detail": "Impossible de démarrer une conversation avec soi-même."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        peer = get_object_or_404(User, id=user_id)
        conv = Conversation.get_or_create_between(request.user, peer)
        serializer = ConversationSerializer(conv, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class DirectMessageHistory(APIView):
    """GET /api/chat/conversations/<conversation_id>/messages/ — historique DM."""
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Historique des messages d'une conversation privée",
        description=(
            "Renvoie les 50 derniers messages directs de la conversation, du plus ancien "
            "au plus recent. Reserve aux deux participants : renvoie 403 si l'utilisateur "
            "n'est ni `user_a` ni `user_b` de la conversation. Renvoie 404 si la "
            "conversation n'existe pas."
        ),
        tags=["Chat"],
        responses={200: DirectMessageSerializer(many=True)},
    )
    def get(self, request, conversation_id):
        conv = get_object_or_404(Conversation, id=conversation_id)
        if not conv.has_participant(request.user):
            return Response(
                {"detail": "Accès refusé."}, status=status.HTTP_403_FORBIDDEN
            )
        messages = (
            DirectMessage.objects
            .filter(conversation=conv)
            .select_related("sender")
            .order_by("created_at")[:50]
        )
        serializer = DirectMessageSerializer(messages, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
