from django.shortcuts import render
from django.db.models import Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from .models import Friendship
from .serializers import FriendshipSerializer, UserSummarySerializer

User = get_user_model()


def _relationship_map(user):
    """other_user_id -> (status, friendship_id) pour l'utilisateur courant.

    status ∈ {friends, pending_sent, pending_received}.
    """
    rel = {}
    qs = Friendship.objects.filter(Q(sender=user) | Q(receiver=user))
    for f in qs:
        other = f.receiver_id if f.sender_id == user.id else f.sender_id
        if f.status == "accepted":
            rel[other] = ("friends", f.id)
        elif f.status == "pending":
            rel[other] = (
                ("pending_sent", f.id) if f.sender_id == user.id
                else ("pending_received", f.id)
            )
    return rel


class FriendListView(APIView):
    """GET /api/friends/ — amis acceptés + demandes reçues/envoyées."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        qs = (
            Friendship.objects
            .filter(Q(sender=user) | Q(receiver=user))
            .select_related("sender", "receiver")
            .order_by("-created_at")
        )
        friends, incoming, outgoing = [], [], []
        for f in qs:
            if f.status == "accepted":
                other = f.receiver if f.sender_id == user.id else f.sender
                friends.append({"friendship_id": f.id, "user": UserSummarySerializer(other).data})
            elif f.status == "pending":
                if f.receiver_id == user.id:
                    incoming.append({"friendship_id": f.id, "user": UserSummarySerializer(f.sender).data})
                else:
                    outgoing.append({"friendship_id": f.id, "user": UserSummarySerializer(f.receiver).data})
        return Response({"friends": friends, "incoming": incoming, "outgoing": outgoing})


class UserSearchView(APIView):
    """GET /api/friends/search/?q= — cherche des joueurs (hors soi-même) et
    annote chaque résultat avec le statut de la relation."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        q = request.query_params.get("q", "").strip()
        if len(q) < 2:
            return Response([])

        users = (
            User.objects
            .filter(Q(username__icontains=q) | Q(email__icontains=q))
            .exclude(id=request.user.id)
            .order_by("username")[:20]
        )
        rel = _relationship_map(request.user)
        data = []
        for u in users:
            rel_status, friendship_id = rel.get(u.id, ("none", None))
            item = UserSummarySerializer(u).data
            item["status"] = rel_status
            item["friendship_id"] = friendship_id
            data.append(item)
        return Response(data)


class SendFriendRequest(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):                         
        receiver_id = request.data.get('receiver_id') 

        try:                                          
            receiver = User.objects.get(id=receiver_id) 
        except User.DoesNotExist:
            return Response({'error': 'Utilisateur introuvable'}, status=status.HTTP_404_NOT_FOUND)

        if receiver == request.user:                   
            return Response({'error': 'Tu ne peux pas t\'ajouter toi-même'}, status=status.HTTP_400_BAD_REQUEST)  

        if Friendship.objects.filter(sender=request.user, receiver=receiver).exists(): 
            return Response({'error': 'Demande déjà envoyée'}, status=status.HTTP_400_BAD_REQUEST)

        friendship = Friendship.objects.create(sender=request.user, receiver=receiver)
        serializer = FriendshipSerializer(friendship)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class AcceptFriendRequest(APIView):
    permission_classes = [IsAuthenticated]

    def put(self,request,friendship_id):
        
        try:
            friendship = Friendship.objects.get(id=friendship_id)
        except Friendship.DoesNotExist:
            return Response({'error': 'Demande introuvable'},status=status.HTTP_404_NOT_FOUND)
        
        if friendship.receiver != request.user:
            return Response({'error': 'Tu n\'es pas autorisé'},status=status.HTTP_403_FORBIDDEN)
        
        if friendship.status != 'pending':
            return Response({'error': 'Cette demande n\'est plus en attente'},status=status.HTTP_400_BAD_REQUEST)
        
        friendship.status = 'accepted'
        friendship.save()

        serializer = FriendshipSerializer(friendship)
        return Response(serializer.data, status=status.HTTP_200_OK)


class DeclineFriendRequest(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, friendship_id):

        try:
            friendship = Friendship.objects.get(id=friendship_id)
        except Friendship.DoesNotExist:
            return Response({'error': 'Demande introuvable'}, status=status.HTTP_404_NOT_FOUND)

        if friendship.receiver != request.user:
            return Response({'error': 'Tu n\'es pas autorisé'}, status=status.HTTP_403_FORBIDDEN)

        if friendship.status != 'pending':
            return Response({'error': 'Cette demande n\'est plus en attente'}, status=status.HTTP_400_BAD_REQUEST)

        friendship.delete()
        return Response({'message': 'Demande refusée'}, status=status.HTTP_200_OK)

class DeleteFriend(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, friendship_id):

        try:
            friendship = Friendship.objects.get(id=friendship_id)
        except Friendship.DoesNotExist:
            return Response({'error': 'Ami introuvable'}, status=status.HTTP_404_NOT_FOUND)

        if friendship.sender != request.user and friendship.receiver != request.user:
            return Response({'error': 'Tu n\'es pas autorisé'}, status=status.HTTP_403_FORBIDDEN)

        if friendship.status != 'accepted':
            return Response({'error': 'Cette personne n\'est pas votre ami'}, status=status.HTTP_400_BAD_REQUEST)

        friendship.delete()
        return Response({'message': 'Ami supprimé'}, status=status.HTTP_200_OK)


