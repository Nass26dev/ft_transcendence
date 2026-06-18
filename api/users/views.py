from rest_framework_simplejwt.tokens import RefreshToken
from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
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
        
        print(f"user_id: {user_id}")
        print(f"code_saisi: {code_saisi} (type: {type(code_saisi)})")
        print(f"code_attendu: {code_attendu} (type: {type(code_attendu)})")
        
        if str(code_saisi) == str(code_attendu):
            user = User.objects.get(id=user_id)
            refresh = RefreshToken.for_user(user)
            cache.delete(f"otp_{user_id}")

            from django.conf import settings
            secure_cookies = not settings.DEBUG

            response = Response({
                "user": UserSerializer(user).data
            }, status=200)

            response.set_cookie(
                key="access_token",
                value=str(refresh.access_token),
                httponly=True,
                secure=secure_cookies,
                samesite="Lax",
                max_age=60 * 5,
            )
            response.set_cookie(
                key="refresh_token",
                value=str(refresh),
                httponly=True,
                secure=secure_cookies,
                samesite="Lax",
                max_age=60 * 60 * 24 * 7,
            )

            return response

        return Response({"error": "Code invalide"}, status=400)

class ProfileView(APIView):
    permission_classes = [IsAuthenticated]
    # Accepte le multipart pour l'upload de la photo de profil.
    parser_classes = [MultiPartParser, FormParser]

    # Taille max de l'avatar : 5 Mo.
    MAX_AVATAR_SIZE = 5 * 1024 * 1024

    def get(self, request):
        # `context={"request"}` → l'URL de l'avatar est renvoyée en absolu.
        serializer = UserSerializer(request.user, context={"request": request})
        return Response(serializer.data)

    def patch(self, request):
        """Met à jour la photo de profil (champ `avatar`, multipart)."""
        avatar = request.FILES.get("avatar")
        if avatar is None:
            return Response({"detail": "Aucun fichier 'avatar' fourni."}, status=400)
        if not (avatar.content_type or "").startswith("image/"):
            return Response({"detail": "Le fichier doit être une image."}, status=400)
        if avatar.size > self.MAX_AVATAR_SIZE:
            return Response({"detail": "Image trop lourde (max 5 Mo)."}, status=400)

        user = request.user
        user.avatar = avatar
        user.save(update_fields=["avatar"])
        serializer = UserSerializer(user, context={"request": request})
        return Response(serializer.data, status=200)


DAILY_BONUS_AMOUNT = 500


class DailyBonusView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from django.db import transaction
        from django.utils import timezone

        today = timezone.localdate()
        with transaction.atomic():
            user = User.objects.select_for_update().get(pk=request.user.pk)
            if user.last_daily_bonus == today:
                return Response(
                    {"detail": "Bonus déjà récupéré aujourd'hui."},
                    status=400,
                )
            user.wallet += DAILY_BONUS_AMOUNT
            user.last_daily_bonus = today
            user.save(update_fields=["wallet", "last_daily_bonus"])

        return Response(UserSerializer(user).data, status=200)

class OnboardingCompleteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        if not user.onboarding_completed:
            user.onboarding_completed = True
            user.save(update_fields=["onboarding_completed"])
        return Response(UserSerializer(user).data, status=200)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()

    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer
