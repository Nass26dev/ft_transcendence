from django.urls import path

from .views import ChallengeListView, ChallengeClaimView, BadgeListView

urlpatterns = [
    path("challenges/", ChallengeListView.as_view(), name="challenge-list"),
    path("challenges/<slug:code>/claim/", ChallengeClaimView.as_view(), name="challenge-claim"),
    path("badges/", BadgeListView.as_view(), name="badge-list"),
]
