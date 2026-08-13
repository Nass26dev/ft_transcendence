from django.urls import path
from .admin_views import (
    AdminUserSearchView,
    AdminUserDetailView,
    AdminUserWalletView,
    AdminUserFriendRemoveView,
    AdminStatsView,
)

urlpatterns = [
    path("stats/", AdminStatsView.as_view(), name="admin-stats"),

    path("users/", AdminUserSearchView.as_view(), name="admin-user-search"),

    path("users/<int:pk>/", AdminUserDetailView.as_view(), name="admin-user-detail"),

    path("users/<int:pk>/wallet/", AdminUserWalletView.as_view(), name="admin-user-wallet"),

    path("users/<int:pk>/friends/<int:friend_pk>/", AdminUserFriendRemoveView.as_view(), name="admin-user-friend-remove"),
]