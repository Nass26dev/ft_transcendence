import json

from channels.generic.websocket import AsyncWebsocketConsumer


class NotificationConsumer(AsyncWebsocketConsumer):
    """Canal temps réel des notifications d'un utilisateur (ws/notifications/)."""

    async def connect(self):
        user = self.scope["user"]
        if user.is_anonymous:
            await self.close()
            return
        self.group_name = f"notif_{user.id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def notify(self, event):
        """Reçoit un push group_send {type:'notify', data:{...}} et l'envoie au client."""
        await self.send(text_data=json.dumps({
            "type": "notification",
            "notification": event["data"],
        }))
