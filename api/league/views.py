from django.contrib.auth import get_user_model
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

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

    def get(self, request):
        leagues = request.user.leagues.all()
        return Response(LeagueSerializer(leagues, many=True).data)



class LeagueDetail(APIView):
    permission_classes = [IsAuthenticated]

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

    def get(self, request):
        invitations = LeagueInvitation.objects.filter(receiver=request.user)
        return Response(LeagueInvitationSerializer(invitations, many=True).data)

class SendLeagueRequest(APIView):
    permission_classes = [IsAuthenticated]

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

