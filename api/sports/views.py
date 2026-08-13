from datetime import date, timedelta
from django.db.models import Count, Q
from django.utils import timezone
from rest_framework.response import Response
from rest_framework.decorators import action
from django_filters import rest_framework as filters
from rest_framework import mixins, viewsets
from drf_spectacular.utils import extend_schema, extend_schema_view
from .models import Match
from .serializers import MatchDetailSerializer, MatchListSerializer, OddsSerializer



class MatchFilter(filters.FilterSet):
    """Filtres disponibles sur la liste des matchs : statut, compétition, date."""

    status = filters.ChoiceFilter(choices=Match.Status)
    competition = filters.CharFilter(field_name="competition__slug")
    date = filters.DateFilter(field_name="kickoff_at", lookup_expr="date")

    class Meta:
        """Modèle et champs filtrables."""

        model = Match
        fields = ["status", "competition", "date"]


@extend_schema_view(
    list=extend_schema(
        tags=["Sport"],
        description=(
            "Liste les matchs, avec pour chacun la répartition des paris par issue "
            "1N2 (`bets_home`, `bets_draw`, `bets_away` — la « Confiance des "
            "Kopistes »), calculée en comptant les sélections de paris liées à "
            "chaque match. Filtrable par `status`, `competition` (slug) et `date` "
            "(jour du coup d'envoi)."
        ),
    ),
    retrieve=extend_schema(
        tags=["Sport"],
        description=(
            "Détail d'un match, incluant ses événements et compositions "
            "(`events`, `lineups`) ainsi que la répartition des paris par issue "
            "1N2 (« Confiance des Kopistes »)."
        ),
    ),
)
class MatchViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """Endpoints en lecture seule pour les matchs : liste, détail, à venir, en direct, cotes."""

    queryset = (
        Match.objects
        .select_related("competition", "home_team", "away_team")
        .prefetch_related("odds")
    )
    serializer_class = MatchListSerializer
    filter_backends = [filters.DjangoFilterBackend]
    filterset_class = MatchFilter

    def get_serializer_class(self):
        """Utilise le serializer détaillé pour `retrieve`, la version liste sinon."""
        if self.action == "retrieve":
            return MatchDetailSerializer
        return MatchListSerializer

    def get_queryset(self):
        """Annote chaque match de la répartition des paris par issue 1N2 (Confiance des
        Kopistes) : on compte les jambes (bet_selections), un combiné comptant pour
        chacun de ses matchs, via un Count(filter=...) qui génère un seul JOIN par FILTER.
        """
        qs = super().get_queryset().annotate(
            bets_home=Count("bet_selections", filter=Q(bet_selections__odd__selection="home")),
            bets_draw=Count("bet_selections", filter=Q(bet_selections__odd__selection="draw")),
            bets_away=Count("bet_selections", filter=Q(bet_selections__odd__selection="away")),
        )
        if self.action == "retrieve":
            qs = qs.prefetch_related("events", "lineups")
        return qs

    @extend_schema(
        summary="Matchs à venir",
        description=(
            "Liste les matchs programmés (`status='scheduled'`) dont le coup "
            "d'envoi tombe dans les 7 prochains jours, triés par date de coup "
            "d'envoi croissante. L'ordre explicite est nécessaire car l'annotation "
            "des compteurs de paris introduit un GROUP BY qui écraserait sinon le "
            "tri par défaut du modèle."
        ),
        tags=["Sport"],
    )
    def upcoming(self, request):
        """Matchs programmés dans les 7 prochains jours, triés par coup d'envoi.

        Le order_by est explicite car l'annotate(Count(...)) du get_queryset ajoute
        un GROUP BY qui écraserait sinon l'ordering du modèle.
        """
        now = timezone.now()
        qs = self.get_queryset().filter(
            status="scheduled",
            kickoff_at__range=(now, now + timedelta(days=7)),
        ).order_by("kickoff_at")
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Matchs en direct",
        description=(
            "Liste les matchs actuellement en cours (`status='live'`) dont le coup "
            "d'envoi remonte à moins de 4 heures, triés par date de coup d'envoi. "
            "Ce filtre temporel couvre les matchs à cheval sur minuit tout en "
            "écartant les matchs restés bloqués à tort au statut « live » "
            "(kickoff trop ancien)."
        ),
        tags=["Sport"],
    )
    def live(self, request):
        """Matchs réellement en cours (status=live démarré dans les dernières heures).

        Le filtre temporel couvre les matchs à cheval sur minuit et écarte les
        "live" fantômes restés bloqués (kickoff vieux de plusieurs jours/mois).
        """
        cutoff = timezone.now() - timedelta(hours=4)
        qs = self.get_queryset().filter(
            status="live", kickoff_at__gte=cutoff
        ).order_by("kickoff_at")
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Cotes d'un match",
        description="Liste toutes les cotes (1N2 et éventuels autres marchés) disponibles pour le match identifié par `pk`.",
        tags=["Sport"],
    )
    def odds(self, request, pk=None):
        """Liste les cotes du match identifié par `pk`."""
        match = self.get_object()
        serializer = OddsSerializer(match.odds.all(), many=True)
        return Response(serializer.data)