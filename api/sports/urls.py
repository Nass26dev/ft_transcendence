# sports/urls.py
from django.urls import path
from .views import MatchViewSet

app_name = "sports"

urlpatterns = [
    path("matches/", MatchViewSet.as_view({"get": "list"}), name="match-list"),
    path("matches/upcoming/", MatchViewSet.as_view({"get": "upcoming"}), name="match-upcoming"),
    path("matches/live/", MatchViewSet.as_view({"get": "live"}), name="match-live"),
    path("matches/<int:pk>/odds/", MatchViewSet.as_view({"get": "odds"}), name="match-odds"),
    path("matches/<int:pk>/", MatchViewSet.as_view({"get": "retrieve"}), name="match-detail"),
]