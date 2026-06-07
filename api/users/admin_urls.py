from django.urls import path
from .admin_views import (
    AdminUserSearchView,
    AdminUserDetailView,
    AdminUserWalletView,
    AdminUserFriendRemoveView,
    AdminStatsView,
)

urlpatterns = [
    # GET /api/admin/stats/
    path("stats/", AdminStatsView.as_view(), name="admin-stats"),

    # GET  /api/admin/users/?q=john  (sans q → liste tout le monde)
    path("users/", AdminUserSearchView.as_view(), name="admin-user-search"),

    # GET   /api/admin/users/42/
    # PATCH /api/admin/users/42/
    path("users/<int:pk>/", AdminUserDetailView.as_view(), name="admin-user-detail"),

    # PATCH /api/admin/users/42/wallet/
    path("users/<int:pk>/wallet/", AdminUserWalletView.as_view(), name="admin-user-wallet"),

    # DELETE /api/admin/users/42/friends/7/
    path("users/<int:pk>/friends/<int:friend_pk>/", AdminUserFriendRemoveView.as_view(), name="admin-user-friend-remove"),
]