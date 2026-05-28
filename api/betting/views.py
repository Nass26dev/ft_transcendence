from rest_framework import viewsets, permissions
from .models import Bet
from .serializers import BetSerializer


class BetViewSet(viewsets.ModelViewSet):

    serializer_class = BetSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Bet.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)