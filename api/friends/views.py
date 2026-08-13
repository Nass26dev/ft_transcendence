from django.shortcuts import render
from django.db.models import Q
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework import serializers
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from drf_spectacular.utils import (
    extend_schema,
    inline_serializer,
    OpenApiResponse,
    OpenApiParameter,
)
from .models import Friendship
from .serializers import FriendshipSerializer, UserSummarySerializer
from betting.models import Bet
from notifications.services import notify

User = get_user_model()


def _relative_fr(dt, now):
    """Durée écoulée en français compact : « à l'instant », « 14 min », « 2 h », « hier », « 3 j »."""
    secs = (now - dt).total_seconds()
    if secs < 60:
        return "à l'instant"
    mins = int(secs // 60)
    if mins < 60:
        return f"{mins} min"
    hours = mins // 60
    if hours < 24:
        return f"{hours} h"
    days = hours // 24
    return "hier" if days == 1 else f"{days} j"


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

    @extend_schema(
        summary="Liste mes amis et mes demandes d'amitié",
        description=(
            "Parcourt toutes les relations `Friendship` où l'utilisateur courant est "
            "`sender` ou `receiver` (triées par date de création décroissante) et les "
            "répartit en trois listes : `friends` (statut `accepted`), `incoming` "
            "(statut `pending` reçues, i.e. l'utilisateur courant est le receiver) et "
            "`outgoing` (statut `pending` envoyées, i.e. l'utilisateur courant est le sender)."
        ),
        tags=["Amis"],
        responses={
            200: inline_serializer(
                name="FriendListGetResponse",
                fields={
                    "friends": inline_serializer(
                        name="FriendListFriendItem",
                        fields={
                            "friendship_id": serializers.IntegerField(),
                            "user": UserSummarySerializer(),
                        },
                        many=True,
                    ),
                    "incoming": inline_serializer(
                        name="FriendListIncomingItem",
                        fields={
                            "friendship_id": serializers.IntegerField(),
                            "user": UserSummarySerializer(),
                        },
                        many=True,
                    ),
                    "outgoing": inline_serializer(
                        name="FriendListOutgoingItem",
                        fields={
                            "friendship_id": serializers.IntegerField(),
                            "user": UserSummarySerializer(),
                        },
                        many=True,
                    ),
                },
            ),
        },
    )
    def get(self, request):
        user = request.user
        qs = (
            Friendship.objects
            .filter(Q(sender=user) | Q(receiver=user))
            .select_related("sender", "receiver")
            .order_by("-created_at")
        )
        ctx = {"request": request}
        friends, incoming, outgoing = [], [], []
        for f in qs:
            if f.status == "accepted":
                other = f.receiver if f.sender_id == user.id else f.sender
                friends.append({"friendship_id": f.id, "user": UserSummarySerializer(other, context=ctx).data})
            elif f.status == "pending":
                if f.receiver_id == user.id:
                    incoming.append({"friendship_id": f.id, "user": UserSummarySerializer(f.sender, context=ctx).data})
                else:
                    outgoing.append({"friendship_id": f.id, "user": UserSummarySerializer(f.receiver, context=ctx).data})
        return Response({"friends": friends, "incoming": incoming, "outgoing": outgoing})


class UserSearchView(APIView):
    """GET /api/friends/search/?q= — cherche des joueurs (hors soi-même) et
    annote chaque résultat avec le statut de la relation."""

    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Recherche de joueurs (hors soi-même)",
        description=(
            "Cherche des utilisateurs par username ou email (correspondance partielle, "
            "insensible à la casse), hors soi-même, limité aux 20 premiers résultats "
            "triés par username. Si `q` fait moins de 2 caractères, renvoie une liste "
            "vide sans erreur. Chaque résultat est annoté avec le statut de la relation "
            "d'amitié vis-à-vis de l'utilisateur courant (`none`, `friends`, "
            "`pending_sent` si une demande a été envoyée, `pending_received` si une "
            "demande a été reçue) et l'id de la relation le cas échéant."
        ),
        tags=["Amis"],
        parameters=[
            OpenApiParameter(
                name="q",
                type=str,
                location=OpenApiParameter.QUERY,
                required=False,
                description="Terme de recherche (username ou email), minimum 2 caractères",
            ),
        ],
        responses={
            200: inline_serializer(
                name="FriendUserSearchResponse",
                fields={
                    "id": serializers.IntegerField(),
                    "username": serializers.CharField(),
                    "email": serializers.EmailField(),
                    "avatar": serializers.CharField(allow_null=True),
                    "bio": serializers.CharField(allow_null=True),
                    "status": serializers.ChoiceField(
                        choices=["none", "friends", "pending_sent", "pending_received"]
                    ),
                    "friendship_id": serializers.IntegerField(allow_null=True),
                },
                many=True,
            ),
        },
    )
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
            item = UserSummarySerializer(u, context={"request": request}).data
            item["status"] = rel_status
            item["friendship_id"] = friendship_id
            data.append(item)
        return Response(data)


class SendFriendRequest(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Envoie une demande d'ami",
        description=(
            "Crée une relation `Friendship` en statut `pending` de l'utilisateur courant "
            "(sender) vers `receiver_id` (receiver), puis notifie le destinataire "
            "(notification `friend_request`). Échoue avec 400 si `receiver_id` correspond "
            "à l'utilisateur courant lui-même (auto-ajout impossible), ou si une demande a "
            "déjà été envoyée par l'utilisateur courant vers ce destinataire (le contrôle "
            "ne vérifie que le sens sender→receiver, pas l'inverse ni un statut déjà "
            "accepté). Renvoie 404 si `receiver_id` ne correspond à aucun utilisateur."
        ),
        tags=["Amis"],
        request=inline_serializer(
            name="SendFriendRequestRequest",
            fields={"receiver_id": serializers.IntegerField()},
        ),
        responses={
            201: FriendshipSerializer,
            400: OpenApiResponse(description="Auto-ajout impossible ou demande déjà envoyée."),
            404: OpenApiResponse(description="Utilisateur introuvable."),
        },
    )
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
        notify(
            receiver.id,
            "friend_request",
            f"{request.user.username} t'a envoyé une demande d'ami.",
            url="/friends",
            actor=request.user,
        )
        serializer = FriendshipSerializer(friendship)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class AcceptFriendRequest(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Accepte une demande d'ami",
        description=(
            "Fait passer le statut de la relation `Friendship` ciblée (id dans l'URL) de "
            "`pending` à `accepted`. Seul le destinataire (`receiver`) de la demande peut "
            "l'accepter, sinon 403. Renvoie 400 si la demande n'est plus en statut "
            "`pending` (déjà acceptée ou refusée/supprimée), et 404 si la relation n'existe pas."
        ),
        tags=["Amis"],
        request=None,
        responses={
            200: FriendshipSerializer,
            400: OpenApiResponse(description="Cette demande n'est plus en attente."),
            403: OpenApiResponse(description="Tu n'es pas autorisé."),
            404: OpenApiResponse(description="Demande introuvable."),
        },
    )
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

    @extend_schema(
        summary="Refuse une demande d'ami",
        description=(
            "Supprime définitivement la relation `Friendship` ciblée (id dans l'URL), ce qui "
            "efface la demande et permettra d'en renvoyer une nouvelle plus tard. Seul le "
            "destinataire (`receiver`) de la demande peut la refuser, sinon 403. Renvoie 400 "
            "si la demande n'est plus en statut `pending` (déjà acceptée), et 404 si la "
            "relation n'existe pas."
        ),
        tags=["Amis"],
        responses={
            200: inline_serializer(
                name="DeclineFriendRequestResponse",
                fields={"message": serializers.CharField()},
            ),
            400: OpenApiResponse(description="Cette demande n'est plus en attente."),
            403: OpenApiResponse(description="Tu n'es pas autorisé."),
            404: OpenApiResponse(description="Demande introuvable."),
        },
    )
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

    @extend_schema(
        summary="Supprime un ami",
        description=(
            "Supprime définitivement la relation `Friendship` ciblée (id dans l'URL) — "
            "rompt l'amitié. Le `sender` d'origine ou le `receiver` peuvent tous deux la "
            "supprimer (n'importe lequel des deux amis), sinon 403 pour un tiers. Renvoie "
            "400 si la relation n'est pas au statut `accepted` (ce n'est pas encore une "
            "amitié confirmée), et 404 si la relation n'existe pas."
        ),
        tags=["Amis"],
        responses={
            200: inline_serializer(
                name="DeleteFriendResponse",
                fields={"message": serializers.CharField()},
            ),
            400: OpenApiResponse(description="Cette personne n'est pas votre ami."),
            403: OpenApiResponse(description="Tu n'es pas autorisé."),
            404: OpenApiResponse(description="Ami introuvable."),
        },
    )
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


class FriendsFeedView(APIView):
    """GET /api/friends/feed/ — activité récente des amis (paris placés / gagnés / perdus).

    Renvoie le flux du « feed des potes » : les derniers paris des amis acceptés
    (hors soi-même), du plus récent au plus ancien.
    """

    permission_classes = [IsAuthenticated]
    LIMIT = 15

    @extend_schema(
        summary="Flux d'activité des amis (feed des potes)",
        description=(
            "Calcule la liste des amis dont la relation est `accepted`, puis renvoie leurs "
            "15 derniers paris (hors paris annulés `cancelled`), filtrés aux utilisateurs "
            "au profil public (`is_public=True`), du plus récent au plus ancien. Chaque "
            "entrée décrit le pari (simple, combiné, gagné ou perdu) avec un texte généré "
            "dynamiquement (mise, cote, équipe/sélection) et une durée relative en français "
            "(« à l'instant », « 14 min », « hier », etc.). Renvoie une liste vide si "
            "l'utilisateur n'a aucun ami accepté."
        ),
        tags=["Amis"],
        responses={
            200: inline_serializer(
                name="FriendsFeedGetResponse",
                fields={
                    "id": serializers.IntegerField(),
                    "user": serializers.CharField(),
                    "avatar": serializers.CharField(allow_null=True),
                    "when": serializers.CharField(),
                    "desc": serializers.CharField(),
                    "pick": serializers.CharField(),
                    "kind": serializers.ChoiceField(choices=["won", "lost", "combo", "simple"]),
                },
                many=True,
            ),
        },
    )
    def get(self, request):
        user = request.user

        # Amis acceptés uniquement (l'autre extrémité de chaque relation).
        friend_ids = set()
        pairs = (
            Friendship.objects.filter(status="accepted")
            .filter(Q(sender_id=user.id) | Q(receiver_id=user.id))
            .values_list("sender_id", "receiver_id")
        )
        for s_id, r_id in pairs:
            friend_ids.add(r_id if s_id == user.id else s_id)

        if not friend_ids:
            return Response([])

        bets = (
            Bet.objects.filter(user_id__in=friend_ids)
            .filter(user__is_public=True)  # seuls les profils publics dans le feed
            .exclude(status="cancelled")
            .select_related("user")
            .prefetch_related(
                "selections__odd",
                "selections__match__home_team",
                "selections__match__away_team",
            )
            .order_by("-created_at")[: self.LIMIT]
        )

        now = timezone.now()
        items = [self._serialize_bet(b, now, request) for b in bets if b.selections.all()]
        return Response(items)

    @staticmethod
    def _leg_short(leg):
        """Nom de l'équipe choisie pour une jambe, ou « match nul »."""
        sel = leg.odd.selection
        return {
            "home": str(leg.match.home_team),
            "away": str(leg.match.away_team),
        }.get(sel, "match nul")

    @staticmethod
    def _leg_label(leg):
        sel = leg.odd.selection
        return {
            "home": f"{leg.match.home_team} vainqueur",
            "away": f"{leg.match.away_team} vainqueur",
        }.get(sel, "Match nul")

    def _serialize_bet(self, bet, now, request):
        legs = list(bet.selections.all())
        n = len(legs)
        is_combo = n > 1
        potential = int(bet.stake * bet.odd_value)

        if bet.status == "won":
            kind, desc = "won", "a gagné"
            pick = f"{potential} K" if is_combo else f"{potential} K sur {self._leg_short(legs[0])}"
        elif bet.status == "lost":
            kind, desc = "lost", "a perdu"
            pick = f"son combiné x{n}" if is_combo else self._leg_label(legs[0])
        elif is_combo:
            kind, desc = "combo", f"a fait un combiné x{n}"
            pick = f"{int(bet.stake)} K → {potential} K potentiels"
        else:
            kind, desc = "simple", f"a parié {int(bet.stake)} K sur"
            pick = f"{self._leg_label(legs[0])} @ {legs[0].odd_value}"

        avatar = (
            request.build_absolute_uri(bet.user.avatar.url)
            if getattr(bet.user, "avatar", None)
            else None
        )
        return {
            "id": bet.id,
            "user": bet.user.username,
            "avatar": avatar,
            "when": _relative_fr(bet.created_at, now),
            "desc": desc,
            "pick": pick,
            "kind": kind,
        }


