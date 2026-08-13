from rest_framework_simplejwt.tokens import RefreshToken
from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework import serializers
from drf_spectacular.utils import extend_schema, inline_serializer, OpenApiResponse
from .serializers import UserSerializer
from rest_framework.permissions import AllowAny
from .models import User, MAX_WALLET
from .serializers import UserSerializer, ProfileUpdateSerializer
import secrets
from .services import send_2fa_email
from django.core.cache import cache
from django.contrib.auth import authenticate

class LoginStep1View(APIView):
    """Première étape du login : vérifie email/mot de passe puis envoie un code 2FA."""

    permission_classes = [AllowAny]

    @extend_schema(
        summary="Premiere etape du login (email + mot de passe)",
        description=(
            "Verifie les identifiants (email ou username + mot de passe) via "
            "authenticate(). Si valides, genere un code OTP a 6 chiffres, le "
            "stocke en cache sous la cle `otp_{user_id}` avec une expiration "
            "de 5 minutes (300s), puis l'envoie par email (2FA). L'etape 2 "
            "(LoginStep2View) devra recevoir ce meme code pour ouvrir la "
            "session. Renvoie 401 si les identifiants sont invalides, et 500 "
            "si l'envoi de l'email de code echoue (probleme technique cote "
            "service mail) — dans ce dernier cas le code est deja en cache "
            "mais l'utilisateur ne l'a pas recu."
        ),
        tags=["Authentification"],
        request=inline_serializer(
            name="LoginStep1PostRequest",
            fields={
                "email": serializers.EmailField(required=False),
                "username": serializers.CharField(required=False),
                "password": serializers.CharField(),
            },
        ),
        responses={
            200: inline_serializer(
                name="LoginStep1PostResponse",
                fields={
                    "message": serializers.CharField(),
                    "user_id": serializers.IntegerField(),
                    "2fa_required": serializers.BooleanField(),
                },
            ),
            401: OpenApiResponse(description="Identifiants invalides"),
            500: OpenApiResponse(description="Probleme technique avec l'envoi du mail"),
        },
    )
    def post(self, request):
        """Vérifie les identifiants et envoie le code OTP par email si valides."""
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
    """Deuxième étape du login : valide le code 2FA et ouvre la session."""

    permission_classes = [AllowAny]

    @extend_schema(
        summary="Deuxieme etape du login (validation du code 2FA)",
        description=(
            "Compare le code saisi au code OTP stocke en cache pour ce "
            "`user_id` (pose par LoginStep1View, valable 5 minutes). Si le "
            "code correspond : supprime le code du cache (usage unique), "
            "genere un JWT (access + refresh) et ouvre la session en posant "
            "deux cookies httpOnly — `access_token` (5 min) et "
            "`refresh_token` (7 jours) — marques `secure` en dehors du mode "
            "DEBUG. Si le code ne correspond pas (ou a expire/n'existe plus "
            "en cache), renvoie 400 sans ouvrir de session."
        ),
        tags=["Authentification"],
        request=inline_serializer(
            name="LoginStep2PostRequest",
            fields={
                "user_id": serializers.IntegerField(),
                "code": serializers.CharField(),
            },
        ),
        responses={
            200: inline_serializer(
                name="LoginStep2PostResponse",
                fields={"user": UserSerializer()},
            ),
            400: OpenApiResponse(description="Code invalide"),
        },
    )
    def post(self, request):
        """Compare le code saisi au code en cache et, si valide, pose les cookies JWT."""
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
    """Profil de l'utilisateur connecté : lecture et mise à jour (champs texte ou avatar).

    Accepte le JSON pour les champs texte (prénom, bio, profil public…) et le
    multipart pour l'upload de la photo de profil.
    """

    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    MAX_AVATAR_SIZE = 5 * 1024 * 1024

    @extend_schema(
        summary="Recupere le profil de l'utilisateur connecte",
        description=(
            "Renvoie les donnees du profil de l'utilisateur authentifie "
            "(via le JWT en cookie). L'URL de l'avatar est renvoyee en "
            "absolu grace au contexte de la requete. Necessite d'etre "
            "authentifie (401 sinon)."
        ),
        tags=["Profil"],
        responses={200: UserSerializer},
    )
    def get(self, request):
        """Renvoie le profil de l'utilisateur connecté (URL de l'avatar en absolu, via `context`)."""
        serializer = UserSerializer(request.user, context={"request": request})
        return Response(serializer.data)

    @extend_schema(
        summary="Met a jour le profil (avatar OU champs texte)",
        description=(
            "Deux modes exclusifs selon le contenu envoye, determines par "
            "la presence du fichier `avatar` dans la requete :\n"
            "- Mode avatar (multipart) : remplace la photo de profil. Le "
            "fichier doit avoir un content-type `image/*` (sinon 400) et "
            "peser au maximum 5 Mo (sinon 400). Les autres champs envoyes "
            "dans la meme requete sont ignores.\n"
            "- Mode champs texte (JSON) : mise a jour partielle (partial=True) "
            "du prenom, nom, pseudo, bio et visibilite du profil via "
            "ProfileUpdateSerializer. Renvoie 400 si la validation du "
            "serializer echoue (ex. pseudo deja pris, champ invalide)."
        ),
        tags=["Profil"],
        request=inline_serializer(
            name="ProfilePatchRequest",
            fields={
                "avatar": serializers.FileField(required=False),
                "first_name": serializers.CharField(required=False),
                "last_name": serializers.CharField(required=False),
                "username": serializers.CharField(required=False),
                "bio": serializers.CharField(required=False),
                "is_public": serializers.BooleanField(required=False),
            },
        ),
        responses={
            200: UserSerializer,
            400: OpenApiResponse(
                description="Fichier non-image, image trop lourde ou champs invalides"
            ),
        },
    )
    def patch(self, request):
        """Met à jour le profil : photo (multipart, champ `avatar`) OU champs
        texte (prénom, nom, pseudo, bio, profil public) en JSON."""
        user = request.user
        avatar = request.FILES.get("avatar")

        if avatar is not None:
            if not (avatar.content_type or "").startswith("image/"):
                return Response({"detail": "Le fichier doit être une image."}, status=400)
            if avatar.size > self.MAX_AVATAR_SIZE:
                return Response({"detail": "Image trop lourde (max 5 Mo)."}, status=400)
            user.avatar = avatar
            user.save(update_fields=["avatar"])
            return Response(UserSerializer(user, context={"request": request}).data, status=200)

        serializer = ProfileUpdateSerializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(user, context={"request": request}).data, status=200)


DAILY_BONUS_AMOUNT = 500


class DailyBonusView(APIView):
    """Bonus quotidien : crédite le wallet de l'utilisateur, une fois par jour civil."""

    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Recupere le bonus quotidien",
        description=(
            f"Credite {DAILY_BONUS_AMOUNT} au solde (wallet) de l'utilisateur, "
            "une seule fois par jour civil (date locale). La verification et "
            "la mise a jour se font dans une transaction avec verrou "
            "(`select_for_update`) pour eviter un double credit en cas de "
            "requetes concurrentes. Si `last_daily_bonus` correspond deja a "
            "la date du jour, renvoie 400 sans re-crediter. Le nouveau solde "
            "est plafonne a MAX_WALLET (min(wallet + bonus, MAX_WALLET))."
        ),
        tags=["Profil"],
        request=None,
        responses={
            200: UserSerializer,
            400: OpenApiResponse(description="Bonus deja recupere aujourd'hui"),
        },
    )
    def post(self, request):
        """Crédite le bonus quotidien si non déjà réclamé aujourd'hui (verrouillé contre les doubles requêtes)."""
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
            user.wallet = min(user.wallet + DAILY_BONUS_AMOUNT, MAX_WALLET)
            user.last_daily_bonus = today
            user.save(update_fields=["wallet", "last_daily_bonus"])

        return Response(UserSerializer(user).data, status=200)

class WheelView(APIView):
    """Configuration de la roue de la chance : cases + disponibilité du jour."""
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Configuration de la roue de la chance",
        description=(
            "Renvoie la liste publique des cases (segments) de la roue "
            "ainsi qu'un booleen `available` indiquant si l'utilisateur "
            "peut encore la faire tourner aujourd'hui (compare "
            "`last_wheel_spin` a la date du jour). Ne modifie rien en base "
            "et ne fait pas tourner la roue — c'est une simple lecture, a "
            "utiliser avant d'appeler WheelSpinView."
        ),
        tags=["Profil"],
        responses={
            200: inline_serializer(
                name="WheelGetResponse",
                fields={
                    "segments": serializers.ListField(child=serializers.DictField()),
                    "available": serializers.BooleanField(),
                },
            ),
        },
    )
    def get(self, request):
        """Renvoie les cases publiques de la roue et si elle est encore disponible aujourd'hui."""
        from django.utils import timezone
        from .wheel import public_segments

        available = request.user.last_wheel_spin != timezone.localdate()
        return Response(
            {"segments": public_segments(), "available": available},
            status=200,
        )


class WheelSpinView(APIView):
    """Tourne la roue (1×/jour). Crédite ou débite le solde du gagnant."""
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Tourne la roue de la chance",
        description=(
            "Effectue un tirage aleatoire (via `spin()`) qui determine un "
            "segment et un montant (`delta`) a appliquer au solde de "
            "l'utilisateur — credit ou debit selon le segment obtenu. "
            "Limite a une fois par jour civil (date locale) : la "
            "verification/mise a jour de `last_wheel_spin` se fait dans une "
            "transaction avec verrou (`select_for_update`) pour eviter les "
            "doubles tirages concurrents. Si la roue a deja ete tournee "
            "aujourd'hui, renvoie 400 sans tirage ni impact sur le solde. "
            "Le solde final est toujours borne a l'intervalle [0, "
            "MAX_WALLET] : une perte importante ne peut pas rendre le "
            "solde negatif."
        ),
        tags=["Profil"],
        request=None,
        responses={
            200: inline_serializer(
                name="WheelSpinPostResponse",
                fields={
                    "index": serializers.IntegerField(),
                    "segment": serializers.DictField(),
                    "delta": serializers.DecimalField(max_digits=12, decimal_places=2),
                    "user": UserSerializer(),
                },
            ),
            400: OpenApiResponse(description="La roue a deja ete tournee aujourd'hui"),
        },
    )
    def post(self, request):
        """Tire une case au hasard et applique son montant au solde, une fois par jour civil."""
        from decimal import Decimal
        from django.db import transaction
        from django.utils import timezone
        from .wheel import spin

        today = timezone.localdate()
        index, segment = spin()
        amount = Decimal(str(segment["amount"]))

        with transaction.atomic():
            user = User.objects.select_for_update().get(pk=request.user.pk)
            if user.last_wheel_spin == today:
                return Response(
                    {"detail": "Tu as déjà tourné la roue aujourd'hui."},
                    status=400,
                )
            before = user.wallet
            user.wallet = max(Decimal("0"), min(user.wallet + amount, MAX_WALLET))
            user.last_wheel_spin = today
            user.save(update_fields=["wallet", "last_wheel_spin"])
            delta = user.wallet - before

        return Response(
            {
                "index": index,
                "segment": segment,
                "delta": delta,
                "user": UserSerializer(user, context={"request": request}).data,
            },
            status=200,
        )


class OnboardingCompleteView(APIView):
    """Marque l'onboarding de l'utilisateur connecté comme terminé (idempotent)."""

    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Marque l'onboarding comme termine",
        description=(
            "Passe `onboarding_completed` a True pour l'utilisateur "
            "connecte, s'il ne l'est pas deja (aucune ecriture en base "
            "sinon — appel idempotent). Renvoie dans tous les cas le "
            "profil a jour de l'utilisateur."
        ),
        tags=["Profil"],
        request=None,
        responses={200: UserSerializer},
    )
    def post(self, request):
        """Passe `onboarding_completed` à True si ce n'est pas déjà fait."""
        user = request.user
        if not user.onboarding_completed:
            user.onboarding_completed = True
            user.save(update_fields=["onboarding_completed"])
        return Response(UserSerializer(user).data, status=200)

