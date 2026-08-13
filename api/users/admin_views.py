from django.db.models import Q, Sum
from rest_framework import status
from rest_framework import serializers
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import (
    extend_schema,
    inline_serializer,
    OpenApiResponse,
    OpenApiParameter,
)

from .models import User
from .admin_serializers import (
    UserAdminDetailSerializer,
    UserAdminListSerializer,
    UserAdminUpdateSerializer,
    WalletUpdateSerializer,
)


class IsAdminOrOwner(IsAuthenticated):
    """Autorise uniquement les users admin ou owner."""

    def has_permission(self, request, view):
        """Vrai si l'utilisateur est authentifié et a le statut admin ou owner."""
        if not super().has_permission(request, view):
            return False
        return request.user.status in ("admin", "owner")


class AdminUserSearchView(APIView):
    """
    GET /api/admin/users/?q=<query>
    Sans `q` : liste tous les utilisateurs (max 100).
    Avec `q`  : filtre par username ou email (insensible à la casse, contient).
    """
    permission_classes = [IsAdminOrOwner]

    @extend_schema(
        summary="Recherche/liste des utilisateurs (admin)",
        description=(
            "Sans le paramètre `q`, liste tous les utilisateurs (hors soi-même, triés par "
            "username, max 100 résultats). Avec `q`, filtre par username OU email "
            "(insensible à la casse, correspondance partielle). "
            "Réservé aux comptes admin ou owner (permission `IsAdminOrOwner`) ; "
            "un utilisateur standard ne peut pas accéder à cette route."
        ),
        tags=["Administration"],
        parameters=[
            OpenApiParameter(
                name="q",
                type=str,
                location=OpenApiParameter.QUERY,
                required=False,
                description="Terme de recherche (username ou email)",
            ),
        ],
        responses={200: UserAdminListSerializer(many=True)},
    )
    def get(self, request):
        """Liste ou recherche des utilisateurs selon le paramètre `q`."""
        q = request.query_params.get("q", "").strip()

        users = User.objects.exclude(id=request.user.id)
        if q:
            users = users.filter(Q(username__icontains=q) | Q(email__icontains=q))

        users = users.order_by("username")[:100]
        return Response(UserAdminListSerializer(users, many=True).data)


class AdminStatsView(APIView):
    """
    GET /api/admin/stats/
    Vue d'ensemble : utilisateurs par rôle, Kops en circulation, paris.
    """
    permission_classes = [IsAdminOrOwner]

    @extend_schema(
        summary="Statistiques globales (dashboard admin)",
        description=(
            "Calcule en direct les métriques du dashboard admin : nombre total d'utilisateurs "
            "et répartition par rôle (owner/admin/user), somme des soldes (wallet) de tous "
            "les comptes (Kops en circulation), et compteurs de paris (total, en attente "
            "`pending`, gagnés `won`). Réservé aux comptes admin ou owner."
        ),
        tags=["Administration"],
        responses={
            200: inline_serializer(
                name="AdminStatsGetResponse",
                fields={
                    "total_users": serializers.IntegerField(),
                    "owners": serializers.IntegerField(),
                    "admins": serializers.IntegerField(),
                    "users": serializers.IntegerField(),
                    "total_wallet": serializers.FloatField(),
                    "total_bets": serializers.IntegerField(),
                    "pending_bets": serializers.IntegerField(),
                    "won_bets": serializers.IntegerField(),
                },
            ),
        },
    )
    def get(self, request):
        """Calcule et renvoie les métriques du dashboard admin."""
        from betting.models import Bet

        users = User.objects.all()
        bets = Bet.objects.all()

        return Response({
            "total_users": users.count(),
            "owners": users.filter(status="owner").count(),
            "admins": users.filter(status="admin").count(),
            "users": users.filter(status="user").count(),
            "total_wallet": float(
                users.aggregate(s=Sum("wallet"))["s"] or 0
            ),
            "total_bets": bets.count(),
            "pending_bets": bets.filter(status="pending").count(),
            "won_bets": bets.filter(status="won").count(),
        })


class AdminUserDetailView(APIView):
    """
    GET  /api/admin/users/<id>/        → détail complet (friends + bets)
    PATCH /api/admin/users/<id>/       → modifie username, email, bio, status
    """
    permission_classes = [IsAdminOrOwner]

    def _get_user(self, pk):
        """Récupère l'utilisateur par sa clé primaire, ou None s'il n'existe pas."""
        try:
            return User.objects.get(pk=pk)
        except User.DoesNotExist:
            return None

    @extend_schema(
        summary="Détail complet d'un utilisateur (admin)",
        description=(
            "Renvoie le profil complet de l'utilisateur ciblé (id de l'URL), la liste de ses "
            "amis dont la relation est au statut `accepted`, et l'historique de ses paris. "
            "Réservé aux comptes admin ou owner ; renvoie 404 si l'id ne correspond à aucun "
            "utilisateur."
        ),
        tags=["Administration"],
        responses={
            200: UserAdminDetailSerializer,
            404: OpenApiResponse(description="Utilisateur introuvable."),
        },
    )
    def get(self, request, pk):
        """Renvoie le détail complet de l'utilisateur ciblé."""
        user = self._get_user(pk)
        if not user:
            return Response({"detail": "Utilisateur introuvable."}, status=404)
        return Response(UserAdminDetailSerializer(user).data)

    @extend_schema(
        summary="Modifie un utilisateur (admin)",
        description=(
            "Modifie username, email, bio et/ou status. "
            "Un admin ne peut pas modifier un owner. "
            "Seul un owner peut changer le rôle (status) d'un utilisateur."
        ),
        tags=["Administration"],
        request=UserAdminUpdateSerializer,
        responses={
            200: UserAdminDetailSerializer,
            400: OpenApiResponse(description="Données invalides (erreurs de validation)."),
            403: OpenApiResponse(description="Action non autorisée (owner protégé ou changement de rôle réservé aux owners)."),
            404: OpenApiResponse(description="Utilisateur introuvable."),
        },
    )
    def patch(self, request, pk):
        """Modifie l'utilisateur ciblé (protège les owners et réserve le changement de rôle aux owners)."""
        user = self._get_user(pk)
        if not user:
            return Response({"detail": "Utilisateur introuvable."}, status=404)

        if user.status == "owner" and request.user.status != "owner":
            return Response(
                {"detail": "Impossible de modifier un owner."},
                status=status.HTTP_403_FORBIDDEN,
            )

        new_status = request.data.get("status")
        if (
            new_status is not None
            and new_status != user.status
            and request.user.status != "owner"
        ):
            return Response(
                {"detail": "Seul un owner peut changer les rôles."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = UserAdminUpdateSerializer(user, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()
        return Response(UserAdminDetailSerializer(user).data)


class AdminUserWalletView(APIView):
    """
    PATCH /api/admin/users/<id>/wallet/   → { "wallet": 500.00 }
    Remplace le solde du user par la valeur donnée.
    """
    permission_classes = [IsAdminOrOwner]

    @extend_schema(
        summary="Modifie le solde (wallet) d'un utilisateur",
        description=(
            "Remplace intégralement le solde (wallet) de l'utilisateur par la valeur fournie "
            "(ce n'est pas un crédit/débit relatif, la valeur précédente est écrasée). "
            "Réservé aux comptes admin ou owner. Renvoie 400 si la valeur est invalide "
            "(validation du serializer) et 404 si l'utilisateur n'existe pas."
        ),
        tags=["Administration"],
        request=WalletUpdateSerializer,
        responses={
            200: inline_serializer(
                name="AdminUserWalletPatchResponse",
                fields={
                    "id": serializers.IntegerField(),
                    "wallet": serializers.FloatField(),
                },
            ),
            400: OpenApiResponse(description="Données invalides (erreurs de validation)."),
            404: OpenApiResponse(description="Utilisateur introuvable."),
        },
    )
    def patch(self, request, pk):
        """Remplace le solde de l'utilisateur ciblé par la valeur fournie."""
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"detail": "Utilisateur introuvable."}, status=404)

        serializer = WalletUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user.wallet = serializer.validated_data["wallet"]
        user.save(update_fields=["wallet"])

        return Response({"id": user.id, "wallet": float(user.wallet)})


class AdminUserFriendRemoveView(APIView):
    """
    DELETE /api/admin/users/<id>/friends/<friend_id>/
    Supprime la relation d'amitié dans les deux sens.
    """
    permission_classes = [IsAdminOrOwner]

    @extend_schema(
        summary="Supprime une relation d'amitié entre deux utilisateurs (admin)",
        description=(
            "Supprime en base la relation `Friendship` entre les deux utilisateurs, peu "
            "importe le sens (peu importe lequel des deux est `sender`/`receiver`) et peu "
            "importe son statut (pending ou accepted). Réservé aux comptes admin ou owner. "
            "Renvoie 404 si aucune relation n'existe entre ces deux utilisateurs."
        ),
        tags=["Administration"],
        responses={
            204: OpenApiResponse(description="Amitié supprimée."),
            404: OpenApiResponse(description="Amitié introuvable."),
        },
    )
    def delete(self, request, pk, friend_pk):
        """Supprime la relation d'amitié entre les deux utilisateurs, quel que soit le sens."""
        from friends.models import Friendship

        deleted, _ = Friendship.objects.filter(
            Q(sender_id=pk, receiver_id=friend_pk) |
            Q(sender_id=friend_pk, receiver_id=pk)
        ).delete()

        if not deleted:
            return Response(
                {"detail": "Amitié introuvable."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(status=status.HTTP_204_NO_CONTENT)