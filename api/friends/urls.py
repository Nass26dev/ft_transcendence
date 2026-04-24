from django.urls import path
from .views import SendFriendRequest, AcceptFriendRequest



urlpatterns = [
    path('request/',SendFriendRequest.as_view(),name='send-friend-request'),
    path('request/<int:friendship_id>/accept/', AcceptFriendRequest.as_view(), name='accept-friend-request'),
]