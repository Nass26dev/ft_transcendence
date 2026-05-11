"""
core/urls.py  — version complète avec endpoints matches
"""

from django.urls import include, path
from django.contrib import admin

from users.views import ProfileView, RegisterView, LoginStep1View, LoginStep2View
from dj_rest_auth.registration.views import SocialLoginView
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter

from matches.views import get_matches, get_live_matches, get_match_detail, get_standings


class GoogleLoginView(SocialLoginView):
    adapter_class = GoogleOAuth2Adapter


urlpatterns = [
    path("admin/", admin.site.urls),

    # ── Auth ──────────────────────────────────────────────────────────
    path("api/auth/login/",         LoginStep1View.as_view(),  name="login_step1"),
    path("api/auth/login/verify/",  LoginStep2View.as_view(),  name="login_step2"),
    path("api/auth/",               include("dj_rest_auth.urls")),
    path("api/auth/registration/",  include("dj_rest_auth.registration.urls")),
    path("api/auth/social/google/", GoogleLoginView.as_view()),

    # ── Profil ────────────────────────────────────────────────────────
    path("api/profile/",  ProfileView.as_view(), name="profile"),
    path("api/register/", RegisterView.as_view(), name="register"),

    # ── Matches ───────────────────────────────────────────────────────
    # GET /api/matches/                     → tous les matchs  (?competition=L1&status=soon&limit=20)
    # GET /api/matches/live/                → matchs en direct
    # GET /api/matches/<id>/               → détail d'un match
    path("api/matches/",        get_matches,      name="matches_list"),
    path("api/matches/live/",   get_live_matches,  name="matches_live"),
    path("api/matches/<int:pk>/", get_match_detail, name="match_detail"),

    # ── Classements ───────────────────────────────────────────────────
    # GET /api/standings/?competition=L1
    path("api/standings/", get_standings, name="standings"),

    # ── Amis ──────────────────────────────────────────────────────────
    path("api/friends/", include("friends.urls")),
]