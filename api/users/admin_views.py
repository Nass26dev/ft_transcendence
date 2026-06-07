from django.db.models import Q, Sum
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

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
        if not super().has_permission(request, view):
            return False
        return request.user.status in ("admin", "owner")


# ── Recherche ──────────────────────────────────────────────────────────────────

class AdminUserSearchView(APIView):
    """
    GET /api/admin/users/?q=<query>
    Sans `q` : liste tous les utilisateurs (max 100).
    Avec `q`  : filtre par username ou email (insensible à la casse, contient).
    """
    permission_classes = [IsAdminOrOwner]

    def get(self, request):
        q = request.query_params.get("q", "").strip()

        users = User.objects.exclude(id=request.user.id)
        if q:
            users = users.filter(Q(username__icontains=q) | Q(email__icontains=q))

        users = users.order_by("username")[:100]
        return Response(UserAdminListSerializer(users, many=True).data)


# ── Statistiques globales (dashboard) ──────────────────────────────────────────

class AdminStatsView(APIView):
    """
    GET /api/admin/stats/
    Vue d'ensemble : utilisateurs par rôle, Kops en circulation, paris.
    """
    permission_classes = [IsAdminOrOwner]

    def get(self, request):
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


# ── Détail + update ────────────────────────────────────────────────────────────

class AdminUserDetailView(APIView):
    """
    GET  /api/admin/users/<id>/        → détail complet (friends + bets)
    PATCH /api/admin/users/<id>/       → modifie username, email, bio, status
    """
    permission_classes = [IsAdminOrOwner]

    def _get_user(self, pk):
        try:
            return User.objects.get(pk=pk)
        except User.DoesNotExist:
            return None

    def get(self, request, pk):
        user = self._get_user(pk)
        if not user:
            return Response({"detail": "Utilisateur introuvable."}, status=404)
        return Response(UserAdminDetailSerializer(user).data)

    def patch(self, request, pk):
        user = self._get_user(pk)
        if not user:
            return Response({"detail": "Utilisateur introuvable."}, status=404)

        # Un admin ne peut pas modifier un owner (sauf si lui-même owner)
        if user.status == "owner" and request.user.status != "owner":
            return Response(
                {"detail": "Impossible de modifier un owner."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Seul un owner peut changer les rôles.
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


# ── Wallet ─────────────────────────────────────────────────────────────────────

class AdminUserWalletView(APIView):
    """
    PATCH /api/admin/users/<id>/wallet/   → { "wallet": 500.00 }
    Remplace le solde du user par la valeur donnée.
    """
    permission_classes = [IsAdminOrOwner]

    def patch(self, request, pk):
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


# ── Amis ───────────────────────────────────────────────────────────────────────

class AdminUserFriendRemoveView(APIView):
    """
    DELETE /api/admin/users/<id>/friends/<friend_id>/
    Supprime la relation d'amitié dans les deux sens.
    """
    permission_classes = [IsAdminOrOwner]

    def delete(self, request, pk, friend_pk):
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