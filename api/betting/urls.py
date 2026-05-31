from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import BetViewSet, TrendingBetsView

router = DefaultRouter()
router.register(r"betting", BetViewSet, basename="bets")

# Route explicite avant le routeur pour qu'elle ne soit pas captée par
# betting/<pk>/ (sinon "trending" serait interprété comme un id).
urlpatterns = [
    path("betting/trending/", TrendingBetsView.as_view(), name="bets-trending"),
] + router.urls