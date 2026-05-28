from rest_framework.routers import DefaultRouter
from .views import BetViewSet

router = DefaultRouter()
router.register(r"betting", BetViewSet, basename="bets")

urlpatterns = router.urls