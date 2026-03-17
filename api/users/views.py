from rest_framework_simplejwt.tokens import RefreshToken
from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .serializers import UserSerializer
from rest_framework import generics
from rest_framework.permissions import AllowAny
from .models import User
from .serializers import UserSerializer, RegisterSerializer
import secrets
from .services import send_2fa_email
from django.core.cache import cache
from django.contrib.auth import authenticate

class LoginStep1View(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email') or request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username=email, password=password)
        if user is not None:
       
            otp_code = "".join([secrets.choice("0123456789") for _ in range(6)])
            cache.set(f"otp_{user.id}", otp_code, timeout=300)
            
            envoi_ok = send_2fa_email(user.email, otp_code)
            
            if envoi_ok:
                return Response({
                    "message": "Code envoyé ! Passez à l'étape 2.",
                    "user_id": user.id,
                    "2fa_required": True
                }, status=200)
            else:
                return Response({"error": "Problème technique avec l'envoi du mail"}, status=500)
        
        return Response({"error": "Identifiants invalides"}, status=401)

class LoginStep2View(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        user_id = request.data.get('user_id')
        code_saisi = request.data.get('code')
        code_attendu = cache.get(f"otp_{user_id}")
        
        if code_attendu and code_saisi == code_attendu:
            user = User.objects.get(id=user_id)
            
            refresh = RefreshToken.for_user(user)
            
            cache.delete(f"otp_{user_id}")
            
            return Response({
                "access": str(refresh.access_token),
                "refresh": str(refresh),            
                "user": UserSerializer(user).data
            }, status=200)
        
        return Response({"error": "Code invalide"}, status=400)

class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()

    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer