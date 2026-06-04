from django.db.models import Q
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
    Cherche par username ou email (insensible à la casse, contient).
    Retourne max 20 résultats.
    """
    permission_classes = [IsAdminOrOwner]

    def get(self, request):
        q = request.query_params.get("q", "").strip()
        if not q:
            return Response(
                {"detail": "Paramètre 'q' requis."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        users = (
            User.objects.filter(
                Q(username__icontains=q) | Q(email__icontains=q)
            )
            .exclude(id=request.user.id)
            .order_by("username")[:20]
        )

        return Response(UserAdminListSerializer(users, many=True).data)


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