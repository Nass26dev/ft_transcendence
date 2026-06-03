from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.generics import get_object_or_404
from django.db.models import Q
from django.contrib.auth import get_user_model

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
