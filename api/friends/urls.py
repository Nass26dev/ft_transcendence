from django.urls import path
from .views import SendFriendRequest, AcceptFriendRequest , DeclineFriendRequest , DeleteFriend



urlpatterns = [
    path('request/',SendFriendRequest.as_view(),name='send-friend-request'),
    path('request/<int:friendship_id>/accept/', AcceptFriendRequest.as_view(), name='accept-friend-request'),
    path ('request/<int:friendship_id>/decline/',DeclineFriendRequest.as_view(),name='decline-friend-request'),
     path ('request/<int:friendship_id>/delete/',DeleteFriend.as_view(),name='delete-friend'),
]