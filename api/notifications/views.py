from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import serializers
from drf_spectacular.utils import extend_schema, inline_serializer

from .models import Notification
from .serializers import NotificationSerializer

LIST_LIMIT = 30
"""Nombre max de notifications renvoyées dans la liste."""


class NotificationListView(APIView):
    """GET /api/notifications/ : dernières notifs + nombre de non-lues."""

    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Liste les dernieres notifications de l'utilisateur",
        description=(
            f"Renvoie au plus les {LIST_LIMIT} notifications les plus "
            "recentes de l'utilisateur connecte (triees par date de "
            "creation decroissante, ordering par defaut du modele), tous "
            "types confondus (message prive, demande d'ami, invitation a "
            "une ligue, pari regle), qu'elles soient lues ou non. Renvoie "
            "aussi `unread`, le nombre TOTAL de notifications non lues de "
            "l'utilisateur (independant de la limite de 30, donc peut etre "
            "superieur au nombre d'elements dans `results`)."
        ),
        tags=["Notifications"],
        responses={
            200: inline_serializer(
                name="NotificationListGetResponse",
                fields={
                    "unread": serializers.IntegerField(),
                    "results": NotificationSerializer(many=True),
                },
            ),
        },
    )
    def get(self, request):
        qs = Notification.objects.filter(recipient=request.user)
        unread = qs.filter(is_read=False).count()
        results = NotificationSerializer(qs[:LIST_LIMIT], many=True).data
        return Response({"unread": unread, "results": results})


class MarkAllReadView(APIView):
    """POST /api/notifications/read-all/ : marque tout comme lu."""

    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Marque toutes les notifications comme lues",
        description=(
            "Passe `is_read=True` sur toutes les notifications non lues de "
            "l'utilisateur connecte, en une seule requete UPDATE en base "
            "(pas de select prealable). Operation idempotente : si aucune "
            "notification n'etait non lue, la requete ne modifie rien. "
            "Renvoie toujours `unread: 0` puisque, par definition, plus "
            "aucune notification n'est non lue apres l'appel."
        ),
        tags=["Notifications"],
        request=None,
        responses={
            200: inline_serializer(
                name="MarkAllReadPostResponse",
                fields={"unread": serializers.IntegerField()},
            ),
        },
    )
    def post(self, request):
        Notification.objects.filter(recipient=request.user, is_read=False).update(
            is_read=True
        )
        return Response({"unread": 0})


class MarkReadView(APIView):
    """POST /api/notifications/<id>/read/ : marque une notif comme lue."""

    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Marque une notification comme lue",
        description=(
            "Passe `is_read=True` sur la notification `pk`, uniquement si "
            "elle appartient a l'utilisateur connecte (`recipient`) et "
            "qu'elle n'est pas deja lue. `updated` vaut 1 si la mise a jour "
            "a eu lieu, 0 sinon (notification inexistante, appartenant a un "
            "autre utilisateur, ou deja marquee comme lue) : aucune erreur "
            "404/403 n'est levee dans ces cas, la reponse reste 200 avec "
            "`updated: 0`. `unread` renvoie dans tous les cas le nombre "
            "total de notifications non lues restantes pour l'utilisateur."
        ),
        tags=["Notifications"],
        request=None,
        responses={
            200: inline_serializer(
                name="MarkReadPostResponse",
                fields={
                    "updated": serializers.IntegerField(),
                    "unread": serializers.IntegerField(),
                },
            ),
        },
    )
    def post(self, request, pk):
        updated = Notification.objects.filter(
            pk=pk, recipient=request.user, is_read=False
        ).update(is_read=True)
        unread = Notification.objects.filter(
            recipient=request.user, is_read=False
        ).count()
        return Response({"updated": updated, "unread": unread})
