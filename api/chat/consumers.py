import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from .models import Message
from league.models import League  # ✅ ajouté
from django.contrib.auth import get_user_model

User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):

    async def connect(self):
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

        async def disconnect(self,close_code):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
        async def receive(self,text_data):
            data = json.loads(text_data)
            content = data['content']
            user = self.scope['user']


            message = await sync_to_async(Message.objects.create)
            (
                sender=user,
                content=content,
                league_id = self.league_id;
            )
        await self.channel_layer.group_send(
            self.room_group_name,
        {
            'type': 'chat_message',
            'message': content,
            'username': user.username,
            'created_at': str(message.created_at)
        }
    )