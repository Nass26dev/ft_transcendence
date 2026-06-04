"""
core/urls.py  — version complète avec endpoints matches
"""

from django.urls import include, path
from django.contrib import admin

from users.views import ProfileView, RegisterView, LoginStep1View, LoginStep2View
from dj_rest_auth.registration.views import SocialLoginView
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter


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
    path("api/", include("users.urls")),

    # ── Amis ──────────────────────────────────────────────────────────
    path("api/friends/", include("friends.urls")),

    # ── Sport ──────────────────────────────────────────────────────────
    path("api/", include("sports.urls")),

    #  Betting
    path("api/", include("betting.urls")),

    #  Défis & badges
    path("api/", include("challenges.urls")),

    #League
    path("api/league/", include("league.urls")),

    #Chat
    path("api/chat/", include("chat.urls")),

    #Notifications
    path("api/notifications/", include("notifications.urls")),

    # admin
    path("api/admin/", include("users.admin_urls")),

]