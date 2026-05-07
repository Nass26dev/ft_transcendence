import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from .models import Message
from league.models import League  # ✅ ajouté
from django.contrib.auth import get_user_model

User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):  # ✅ la classe

    async def connect(self):  # ✅ indenté dans la classe
        self.league_id = self.scope['url_route']['kwargs']['league_id']
        self.room_group_name = f'chat_{self.league_id}'
        user = self.scope['user']

        if user.is_anonymous:
            await self.close()
            return

        is_member = await sync_to_async(League.objects.filter(id=self.league_id, members=user).exists)()

        if not is_member:
            await self.close()
            return

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()