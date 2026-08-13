import json

from channels.generic.websocket import AsyncWebsocketConsumer


class NotificationConsumer(AsyncWebsocketConsumer):
    """Canal temps réel des notifications d'un utilisateur (ws/notifications/)."""

    async def connect(self):
        """Rejette la connexion si l'utilisateur n'est pas authentifié, sinon rejoint son canal personnel."""
        user = self.scope["user"]
        if user.is_anonymous:
            await self.close()
            return
        self.group_name = f"notif_{user.id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        """Quitte le canal personnel (si la connexion avait été acceptée)."""
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def notify(self, event):
        """Reçoit un push group_send {type:'notify', data:{...}} et l'envoie au client."""
        await self.send(text_data=json.dumps({
            "type": "notification",
            "notification": event["data"],
        }))
