from rest_framework import serializers
from .models import Bet

class BetSerializer(serializers.ModelSerializer):

    class Meta:
        model = Bet
        fields = "__all__"
        read_only_fields = (
            "user",
            "created_at",
            "settled_at",
        )
