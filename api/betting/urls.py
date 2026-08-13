from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import BetViewSet, TrendingBetsView, LeaderboardView

router = DefaultRouter()
router.register(r"betting", BetViewSet, basename="bets")

urlpatterns = [
    path("betting/trending/", TrendingBetsView.as_view(), name="bets-trending"),
    path("leaderboard/", LeaderboardView.as_view(), name="leaderboard"),
] + router.urls