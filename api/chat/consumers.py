import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from asgiref.sync import sync_to_async
from .models import Message, Conversation, DirectMessage
from league.models import League
from django.contrib.auth import get_user_model
from notifications.services import notify

User = get_user_model()


class ChatConsumer(AsyncWebsocketConsumer):
    """Chat de ligue (discussion de groupe)."""

    async def connect(self):
        self.league_id = self.scope['url_route']['kwargs']['league_id']
        self.room_group_name = f'chat_{self.league_id}'
        user = self.scope['user']

        if user.is_anonymous:
            await self.close()
            return

        is_member = await sync_to_async(
            League.objects.filter(id=self.league_id, members=user).exists
        )()

        if not is_member:
            await self.close()
            return

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        content = (data.get('content') or '').strip()
        if not content:
            return
        user = self.scope['user']

        message = await sync_to_async(Message.objects.create)(
            sender=user,
            content=content,
            league_id=self.league_id,
        )

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'id': message.id,
                'message': content,
                'sender_id': user.id,
                'username': user.username,
                'created_at': str(message.created_at),
            }
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'id': event['id'],
            'message': event['message'],
            'sender_id': event['sender_id'],
            'username': event['username'],
            'created_at': event['created_at'],
        }))


class DMConsumer(AsyncWebsocketConsumer):
    """Chat privé (message direct) entre deux utilisateurs."""

    async def connect(self):
        self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']
        self.room_group_name = f'dm_{self.conversation_id}'
        user = self.scope['user']

        if user.is_anonymous:
            await self.close()
            return

        self.conversation = await sync_to_async(
            lambda: Conversation.objects.filter(id=self.conversation_id).first()
        )()

        if self.conversation is None or not self.conversation.has_participant(user):
            await self.close()
            return

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        content = (data.get('content') or '').strip()
        if not content:
            return
        user = self.scope['user']

        message = await sync_to_async(DirectMessage.objects.create)(
            sender=user,
            content=content,
            conversation_id=self.conversation_id,
        )

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'dm_message',
                'id': message.id,
                'message': content,
                'sender_id': user.id,
                'username': user.username,
                'created_at': str(message.created_at),
            }
        )

        # Notifie l'interlocuteur (id calculé sans requête supplémentaire).
        conv = self.conversation
        recipient_id = (
            conv.user_b_id if conv.user_a_id == user.id else conv.user_a_id
        )
        await database_sync_to_async(notify)(
            recipient_id,
            "dm",
            f"{user.username} t'a envoyé un message.",
            url="/chat",
            actor=user,
        )

    async def dm_message(self, event):
        await self.send(text_data=json.dumps({
            'id': event['id'],
            'message': event['message'],
            'sender_id': event['sender_id'],
            'username': event['username'],
            'created_at': event['created_at'],
        }))
