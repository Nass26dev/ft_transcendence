from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Notification
from .serializers import NotificationSerializer

# Nombre max de notifications renvoyées dans la liste.
LIST_LIMIT = 30


class NotificationListView(APIView):
    """GET /api/notifications/ — dernières notifs + nombre de non-lues."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Notification.objects.filter(recipient=request.user)
        unread = qs.filter(is_read=False).count()
        results = NotificationSerializer(qs[:LIST_LIMIT], many=True).data
        return Response({"unread": unread, "results": results})


class MarkAllReadView(APIView):
    """POST /api/notifications/read-all/ — marque tout comme lu."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        Notification.objects.filter(recipient=request.user, is_read=False).update(
            is_read=True
        )
        return Response({"unread": 0})


class MarkReadView(APIView):
    """POST /api/notifications/<id>/read/ — marque une notif comme lue."""

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        updated = Notification.objects.filter(
            pk=pk, recipient=request.user, is_read=False
        ).update(is_read=True)
        unread = Notification.objects.filter(
            recipient=request.user, is_read=False
        ).count()
        return Response({"updated": updated, "unread": unread})
