from django.urls import path
from .views import (
    LeagueMessageHistory,
    ConversationList,
    DirectMessageHistory,
)

urlpatterns = [
    # ── Chat de ligue (groupe) ──────────────────────────────────────────
    path("leagues/<int:league_id>/messages/", LeagueMessageHistory.as_view()),

    # ── Messages directs (DM) ───────────────────────────────────────────
    path("conversations/", ConversationList.as_view()),
    path("conversations/<int:conversation_id>/messages/", DirectMessageHistory.as_view()),
]
