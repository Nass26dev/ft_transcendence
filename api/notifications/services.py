"""Création + diffusion temps réel des notifications.

`notify()` crée la notification en base et la pousse au destinataire via le
canal WebSocket `notif_<user_id>` (Channels/Redis), une fois la transaction
courante validée (on_commit) pour éviter de pousser une notif annulée.
"""
import logging

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db import transaction

from .models import Notification
from .serializers import NotificationSerializer

logger = logging.getLogger(__name__)


def notify(recipient_id, type, message, url="", actor=None, data=None):
    """Crée une notification et la diffuse en temps réel. Renvoie l'objet (ou None).

    On ne notifie jamais quelqu'un de sa propre action.
    """
    if actor is not None and getattr(actor, "id", None) == recipient_id:
        return None

    notif = Notification.objects.create(
        recipient_id=recipient_id,
        actor=actor,
        type=type,
        message=message,
        url=url,
        data=data or {},
    )
    payload = NotificationSerializer(notif).data
    transaction.on_commit(lambda: _push(recipient_id, payload))
    return notif


def _push(recipient_id, payload):
    """Diffuse la notification sur le canal WebSocket du destinataire.

    Toute exception est capturée et journalisée sans être relevée : un push
    raté ne doit jamais faire échouer la requête HTTP qui l'a déclenché.
    """
    layer = get_channel_layer()
    if layer is None:
        return
    try:
        async_to_sync(layer.group_send)(
            f"notif_{recipient_id}",
            {"type": "notify", "data": payload},
        )
    except Exception as exc:
        logger.warning("Push notif échoué pour %s : %s", recipient_id, exc)
