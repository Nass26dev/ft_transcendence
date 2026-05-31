# sports/views.py
from datetime import date, timedelta
from django.db.models import Count, Q
from django.utils import timezone
from rest_framework.response import Response
from rest_framework.decorators import action
from django_filters import rest_framework as filters
from rest_framework import mixins, viewsets
from .models import Match
from .serializers import MatchListSerializer, OddsSerializer



class MatchFilter(filters.FilterSet):
    status = filters.ChoiceFilter(choices=Match.Status)
    competition = filters.CharFilter(field_name="competition__slug")
    date = filters.DateFilter(field_name="kickoff_at", lookup_expr="date")

    class Meta:
        model = Match
        fields = ["status", "competition", "date"]


class MatchViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    queryset = (
        Match.objects
        .select_related("competition", "home_team", "away_team")
        .prefetch_related("odds")
    )
    serializer_class = MatchListSerializer
    filter_backends = [filters.DjangoFilterBackend]
    filterset_class = MatchFilter

    def get_queryset(self):
        # Répartition des paris par sélection 1N2 (Confiance des Kopistes).
        # Count(filter=...) génère un seul JOIN via FILTER, sans multiplier les lignes.
        return super().get_queryset().annotate(
            bets_home=Count("bets", filter=Q(bets__odd__selection="home")),
            bets_draw=Count("bets", filter=Q(bets__odd__selection="draw")),
            bets_away=Count("bets", filter=Q(bets__odd__selection="away")),
        )

    def upcoming(self, request):
        now = timezone.now()
        qs = self.get_queryset().filter(
            status="scheduled",
            kickoff_at__range=(now, now + timedelta(days=7)),
        )
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    def live(self, request):
        today = date.today()
        qs = self.get_queryset().filter(status="live", kickoff_at__date=today)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    def odds(self, request, pk=None):
        match = self.get_object()
        serializer = OddsSerializer(match.odds.all(), many=True)
        return Response(serializer.data)