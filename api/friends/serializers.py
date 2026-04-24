from rest_framework import serializers
from .models import Friendship
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'avatar', 'bio']


class FriendshipSerializer(serializers.ModelSerializer):
    sender = UserSummarySerializer(read_only=True)
    receiver = UserSummarySerializer(read_only=True)

    class Meta:
        model = Friendship
        fields = ['id', 'sender', 'receiver', 'status', 'created_at']