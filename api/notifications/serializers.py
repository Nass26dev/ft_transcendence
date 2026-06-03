from rest_framework import serializers

from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    actor = serializers.CharField(source="actor.username", read_only=True, default=None)

    class Meta:
        model = Notification
        fields = [
            "id",
            "type",
            "actor",
            "message",
            "url",
            "data",
            "is_read",
            "created_at",
        ]
