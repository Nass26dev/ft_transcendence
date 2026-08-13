from django.contrib.auth import get_user_model
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status, serializers

from drf_spectacular.utils import extend_schema, inline_serializer, OpenApiResponse

from .models import League, LeagueInvitation
from .serializers import (
    LeagueSerializer,
    LeagueInvitationSerializer,
    UserMiniSerializer
)
from notifications.services import notify

User = get_user_model()

class CreateLeague(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Créer une nouvelle ligue",
        description=(
            "Crée une ligue avec un nom unique et une description, et enregistre l'utilisateur "
            "connecté comme créateur (creator) de la ligue. Le créateur est automatiquement "
            "ajouté à la liste des membres (league.members). "
            "Erreur 400 si name ou description sont absents/vides, ou si une ligue portant "
            "déjà ce nom existe (le nom de ligue est unique)."
        ),
        tags=["Ligues"],
        request=inline_serializer(
            name="CreateLeaguePostRequest",
            fields={
                "name": serializers.CharField(),
                "description": serializers.CharField(),
            },
        ),
        responses={
            201: LeagueSerializer,
            400: OpenApiResponse(description="name et description requis, ou league déjà existante"),
        },
    )
    def post(self, request):
        name = request.data.get("name")
        description = request.data.get("description", "")

        if not name or not description:
            return Response(
                {"error": "name et description requis"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if League.objects.filter(name=name).exists():
            return Response(
                {"error": "League déjà existante"},
                status=status.HTTP_400_BAD_REQUEST
            )

        league = League.objects.create(
            name=name,
            description=description,
            creator=request.user
        )
        league.members.add(request.user)

        return Response(
            LeagueSerializer(league).data,
            status=status.HTTP_201_CREATED
        )



class LeagueList(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Lister les ligues de l'utilisateur connecté",
        description=(
            "Renvoie uniquement les ligues dont l'utilisateur connecté fait partie "
            "(relation league.members), qu'il en soit le créateur ou un simple membre. "
            "N'inclut pas les ligues auxquelles il n'a pas encore adhéré."
        ),
        tags=["Ligues"],
        responses={200: LeagueSerializer(many=True)},
    )
    def get(self, request):
        leagues = request.user.leagues.all()
        return Response(LeagueSerializer(leagues, many=True).data)



class LeagueDetail(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Détail d'une ligue",
        description=(
            "Renvoie les informations d'une ligue (nom, description, créateur, membres, etc.) "
            "à partir de son id. Accessible à tout utilisateur authentifié, membre ou non de la ligue. "
            "Erreur 404 si aucune ligue ne correspond à l'id fourni."
        ),
        tags=["Ligues"],
        responses={
            200: LeagueSerializer,
            404: OpenApiResponse(description="League introuvable"),
        },
    )
    def get(self, request, league_id):
        try:
            league = League.objects.get(id=league_id)
        except League.DoesNotExist:
            return Response(
                {"error": "League introuvable"},
                status=status.HTTP_404_NOT_FOUND
            )

        return Response(LeagueSerializer(league).data)


class MemberInLeague(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Lister les membres d'une ligue",
        description=(
            "Renvoie la liste (données minimales) de tous les utilisateurs membres de la ligue "
            "identifiée par league_id, y compris le créateur. Accessible à tout utilisateur "
            "authentifié, même s'il n'est pas lui-même membre de la ligue. "
            "Erreur 404 si la ligue n'existe pas."
        ),
        tags=["Ligues"],
        responses={
            200: UserMiniSerializer(many=True),
            404: OpenApiResponse(description="League introuvable"),
        },
    )
    def get(self, request, league_id):
        try:
            league = League.objects.get(id=league_id)
        except League.DoesNotExist:
            return Response(
                {"error": "League introuvable"},
                status=status.HTTP_404_NOT_FOUND
            )

        members = league.members.all()
        return Response(UserMiniSerializer(members, many=True).data)


class LeagueInvitationList(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Lister les invitations de ligue reçues par l'utilisateur connecté",
        description=(
            "Renvoie toutes les invitations de ligue en attente dont l'utilisateur connecté est "
            "le destinataire (receiver). N'inclut pas les invitations envoyées par l'utilisateur "
            "ni celles déjà acceptées/refusées (celles-ci sont supprimées de la base à ce moment-là)."
        ),
        tags=["Ligues"],
        responses={200: LeagueInvitationSerializer(many=True)},
    )
    def get(self, request):
        invitations = LeagueInvitation.objects.filter(receiver=request.user)
        return Response(LeagueInvitationSerializer(invitations, many=True).data)

class SendLeagueRequest(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Envoyer une invitation à rejoindre une ligue",
        description=(
            "Seul le créateur de la ligue peut inviter un utilisateur (403 sinon). "
            "Crée une LeagueInvitation liant la ligue, l'expéditeur (le créateur) et le "
            "destinataire, puis déclenche une notification 'league_invite' au destinataire. "
            "Échoue en 400 si receiver_id/league_id sont manquants, si l'utilisateur tente de "
            "s'inviter lui-même, si le destinataire est déjà membre de la ligue, ou si une "
            "invitation vers ce destinataire pour cette ligue existe déjà (pas de doublon). "
            "Erreur 404 si l'utilisateur ou la ligue n'existent pas."
        ),
        tags=["Ligues"],
        request=inline_serializer(
            name="SendLeagueRequestPostRequest",
            fields={
                "receiver_id": serializers.IntegerField(),
                "league_id": serializers.IntegerField(),
            },
        ),
        responses={
            201: inline_serializer(
                name="SendLeagueRequestPostResponse",
                fields={"message": serializers.CharField()},
            ),
            400: OpenApiResponse(description="receiver_id/league_id manquants, auto-invitation, membre déjà présent ou invitation déjà envoyée"),
            403: OpenApiResponse(description="Seul le créateur peut inviter"),
            404: OpenApiResponse(description="Utilisateur ou ligue introuvable"),
        },
    )
    def post(self, request):
        receiver_id = request.data.get('receiver_id')
        league_id = request.data.get('league_id')

        if not receiver_id or not league_id:
            return Response(
                {"error": "receiver_id et league_id sont requis"},
                status=status.HTTP_400_BAD_REQUEST)

        try:
            receiver = User.objects.get(id=receiver_id)
        except User.DoesNotExist:
            return Response(
                {"error": "Utilisateur introuvable"},
                status=status.HTTP_404_NOT_FOUND)

        try:
            league = League.objects.get(id=league_id)
        except League.DoesNotExist:
            return Response(
                {"error": "Ligue introuvable"},
                status=status.HTTP_404_NOT_FOUND)

        if league.creator != request.user:
            return Response(
                {"error": "Seul le créateur peut inviter"},
                status=status.HTTP_403_FORBIDDEN)

        if receiver == request.user:
            return Response(
                {"error": "Impossible de s'inviter soi-même"},
                status=status.HTTP_400_BAD_REQUEST)

        if league.members.filter(id=receiver.id).exists():
            return Response(
                {"error": "L'utilisateur est déjà membre"},
                status=status.HTTP_400_BAD_REQUEST)

        if LeagueInvitation.objects.filter(league=league, receiver=receiver).exists():
            return Response(
                {"error": "Invitation déjà envoyée"},
                status=status.HTTP_400_BAD_REQUEST)

        LeagueInvitation.objects.create(league=league, sender=request.user, receiver=receiver)
        notify(
            receiver.id,
            "league_invite",
            f"{request.user.username} t'a invité dans la ligue « {league.name} ».",
            url="/leagues",
            actor=request.user,
            data={"league_id": league.id},
        )

        return Response(
            {"message": "Invitation envoyée"},
            status=status.HTTP_201_CREATED)




class AcceptInvitation(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Accepter une invitation de ligue",
        description=(
            "L'invitation doit être adressée à l'utilisateur connecté (recherchée par id ET "
            "receiver=request.user), sinon 404 même si l'invitation existe pour quelqu'un d'autre. "
            "Ajoute l'utilisateur connecté aux membres de la ligue liée à l'invitation puis "
            "supprime définitivement l'invitation (elle ne peut donc être acceptée qu'une seule fois)."
        ),
        tags=["Ligues"],
        request=None,
        responses={
            200: inline_serializer(
                name="AcceptInvitationPostResponse",
                fields={"message": serializers.CharField()},
            ),
            404: OpenApiResponse(description="Invitation introuvable"),
        },
    )
    def post(self, request,invitation_id):
        try:
            invitation = LeagueInvitation.objects.get(
                id = invitation_id,
                receiver = request.user
            )
        except LeagueInvitation.DoesNotExist:
            return Response(
                {"error": "invitation introuvable"},
                status=status.HTTP_404_NOT_FOUND
            )

        invitation.league.members.add(request.user)
        invitation.delete()

        return Response(
            {"message": "invitation acceptée"},
            status=status.HTTP_200_OK
        )

class DeclineInvitation(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Refuser une invitation de ligue",
        description=(
            "L'invitation doit être adressée à l'utilisateur connecté (recherchée par id ET "
            "receiver=request.user), sinon 404. Supprime définitivement l'invitation sans "
            "ajouter l'utilisateur à la ligue ; l'opération est donc irréversible et l'invitation "
            "ne peut plus être acceptée ensuite."
        ),
        tags=["Ligues"],
        request=None,
        responses={
            200: inline_serializer(
                name="DeclineInvitationPostResponse",
                fields={"message": serializers.CharField()},
            ),
            404: OpenApiResponse(description="Invitation introuvable"),
        },
    )
    def post(self, request, invitation_id):
        try:
            invitation = LeagueInvitation.objects.get(
                id=invitation_id,
                receiver=request.user
            )
        except LeagueInvitation.DoesNotExist:
            return Response(
                {"error": "Invitation introuvable"},
                status=status.HTTP_404_NOT_FOUND
            )

        invitation.delete()

        return Response(
            {"message": "Invitation refusée"},
            status=status.HTTP_200_OK
        )






class LeaveLeague(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Quitter une ligue",
        description=(
            "Retire l'utilisateur connecté de la liste des membres (league.members) de la ligue. "
            "Erreur 400 si l'utilisateur n'est pas membre de cette ligue. "
            "Le créateur de la ligue ne peut jamais la quitter par cette route (400 si "
            "league.creator == request.user) : ce endpoint ne fait ni transfert de propriété "
            "ni suppression de la ligue, même si le créateur est le dernier membre restant."
        ),
        tags=["Ligues"],
        request=None,
        responses={
            200: inline_serializer(
                name="LeaveLeaguePostResponse",
                fields={"message": serializers.CharField()},
            ),
            400: OpenApiResponse(description="Pas membre de cette league, ou créateur ne pouvant pas quitter"),
            404: OpenApiResponse(description="League introuvable"),
        },
    )
    def post(self,request,league_id):
        try:
            league=League.objects.get(id=league_id)
        except League.DoesNotExist:
            return Response(
                {"error": "League introuvable"},
                status=status.HTTP_404_NOT_FOUND
            )

        if request.user not in league.members.all():
            return Response(
                {"error":" Tu n'est pas membre de cette league"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if league.creator==request.user:
            return Response(
                {"error":"Le créateur ne peut pas quitter la league"},
                status=status.HTTP_400_BAD_REQUEST
            )
        league.members.remove(request.user)

        return Response(
            {"message":"Tu as quitté la league"},
            status=status.HTTP_200_OK
        )

class KickMember(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Expulser un membre d'une ligue",
        description=(
            "Seul le créateur de la ligue peut expulser un membre (403 sinon). "
            "Retire l'utilisateur ciblé (user_id) de la liste des membres de la ligue. "
            "Erreur 400 si l'utilisateur ciblé n'est pas membre de la ligue, ou si l'on tente "
            "d'expulser le créateur lui-même (impossible, quel que soit qui fait la demande). "
            "Erreur 404 si la ligue ou l'utilisateur ciblé n'existent pas."
        ),
        tags=["Ligues"],
        request=None,
        responses={
            200: inline_serializer(
                name="KickMemberPostResponse",
                fields={"message": serializers.CharField()},
            ),
            400: OpenApiResponse(description="Utilisateur non membre de la league, ou tentative d'expulser le créateur"),
            403: OpenApiResponse(description="Seul le créateur peut expulser un membre"),
            404: OpenApiResponse(description="League ou utilisateur introuvable"),
        },
    )
    def post(self, request, league_id, user_id):

        try:
            league = League.objects.get(id=league_id)
        except League.DoesNotExist:
            return Response(
                {"error": "League introuvable"},
                status=status.HTTP_404_NOT_FOUND
            )
        if league.creator != request.user:
            return Response(
                {"error": "Seul le créateur peut expulser un membre"},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            user_to_kick = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {"error": "Utilisateur introuvable"},
                status=status.HTTP_404_NOT_FOUND
            )

        if not league.members.filter(id=user_to_kick.id).exists():
            return Response(
                {"error": "Cet utilisateur n'est pas membre de la league"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if user_to_kick == league.creator:
            return Response(
                {"error": "Impossible de kick le créateur"},
                status=status.HTTP_400_BAD_REQUEST
            )

        league.members.remove(user_to_kick)

        return Response(
            {"message": f"{user_to_kick.username} a été expulsé"},
            status=status.HTTP_200_OK
        )

class AllLeague(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Lister toutes les ligues existantes",
        description=(
            "Renvoie l'ensemble des ligues présentes en base de données, sans filtrage par "
            "appartenance : contrairement à /league/ (LeagueList), cette route sert d'annuaire "
            "public permettant de découvrir des ligues auxquelles l'utilisateur n'est pas encore "
            "inscrit, en vue d'y envoyer une demande/invitation."
        ),
        tags=["Ligues"],
        responses={200: LeagueSerializer(many=True)},
    )
    def get(self,request):
        leagues = League.objects.all()
        serializer = LeagueSerializer(leagues,many=True)
        return Response(serializer.data)


class LeagueLeaderboard(APIView):
    """GET /api/league/<id>/leaderboard/ — membres de la ligue classés par Kops.

    Le score est le solde Kops courant (wallet) de chaque membre, du plus riche
    au moins riche. Renvoie nom de ligue, effectif et classement.
    """

    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Classement des membres d'une ligue par solde de Kops",
        description=(
            "Calcule un classement (leaderboard) des membres de la ligue en fonction de leur "
            "solde de Kops (champ wallet), du plus élevé au plus faible ; en cas d'égalité de "
            "solde, le tri secondaire se fait par username (ordre alphabétique). "
            "Chaque entrée indique le rang (rank, à partir de 1), l'utilisateur, son solde, et "
            "un booléen 'me' indiquant s'il s'agit de l'utilisateur connecté. "
            "Erreur 404 si la ligue n'existe pas."
        ),
        tags=["Ligues"],
        responses={
            200: inline_serializer(
                name="LeagueLeaderboardGetResponse",
                fields={
                    "id": serializers.IntegerField(),
                    "name": serializers.CharField(),
                    "members_count": serializers.IntegerField(),
                    "entries": inline_serializer(
                        name="LeagueLeaderboardEntry",
                        fields={
                            "rank": serializers.IntegerField(),
                            "user_id": serializers.IntegerField(),
                            "username": serializers.CharField(),
                            "kops": serializers.IntegerField(),
                            "me": serializers.BooleanField(),
                        },
                        many=True,
                    ),
                },
            ),
            404: OpenApiResponse(description="League introuvable"),
        },
    )
    def get(self, request, league_id):
        try:
            league = League.objects.get(id=league_id)
        except League.DoesNotExist:
            return Response(
                {"error": "League introuvable"},
                status=status.HTTP_404_NOT_FOUND
            )

        members = league.members.all().order_by("-wallet", "username")
        entries = [
            {
                "rank": i,
                "user_id": m.id,
                "username": m.username,
                "kops": int(m.wallet),
                "me": m.id == request.user.id,
            }
            for i, m in enumerate(members, start=1)
        ]
        return Response({
            "id": league.id,
            "name": league.name,
            "members_count": len(entries),
            "entries": entries,
        })
