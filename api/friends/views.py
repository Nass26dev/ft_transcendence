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