from django.urls import path
from .views import SendFriendRequest



urlpatterns = [
    path('request/',SendFriendRequest.as_view(),name='send-friend-request'),
]