from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from .models import Message
from .serializers import MessageSerializer




User = get_user_model()

class MessageHistory(APIView):
    permission_classes = [IsAuthenticated]

    def get(self,request,league_id):
        messages = Message.objects.filter(league_id=league_id)
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data,status=status.HTTP_200_OK)

