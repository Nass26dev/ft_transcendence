from django.urls import path
from .views import MessageHistory

urlpatterns = [
    path('<int:league_id>/history/', MessageHistory.as_view(), name='message-history'),
]