from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from .models import Friendship
from .serializers import FriendshipSerializer

User = get_user_model()


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
