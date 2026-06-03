from django.urls import re_path
from .consumers import ChatConsumer, DMConsumer

websocket_urlpatterns = [
    re_path(
        r"ws/chat/(?P<league_id>\d+)/$",
        ChatConsumer.as_asgi(),
    ),
    re_path(
        r"ws/dm/(?P<conversation_id>\d+)/$",
        DMConsumer.as_asgi(),
    ),
]
