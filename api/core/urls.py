"""
core/urls.py : version complète avec endpoints matches
"""

from django.urls import include, path
from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static

from users.views import ProfileView, LoginStep1View, LoginStep2View
from dj_rest_auth.registration.views import SocialLoginView
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView


class GoogleLoginView(SocialLoginView):
    """Vue de connexion sociale Google, basée sur l'adapter OAuth2 d'allauth."""

    adapter_class = GoogleOAuth2Adapter


urlpatterns = [
    path("admin/", admin.site.urls),

    path("api/auth/login/",         LoginStep1View.as_view(),  name="login_step1"),
    path("api/auth/login/verify/",  LoginStep2View.as_view(),  name="login_step2"),
    path("api/auth/",               include("dj_rest_auth.urls")),
    path("api/auth/registration/",  include("dj_rest_auth.registration.urls")),
    path("api/auth/social/google/", GoogleLoginView.as_view()),

    path("api/", include("users.urls")),

    path("api/friends/", include("friends.urls")),

    path("api/", include("sports.urls")),

    path("api/", include("betting.urls")),

    path("api/", include("challenges.urls")),

    path("api/league/", include("league.urls")),

    path("api/chat/", include("chat.urls")),

    path("api/notifications/", include("notifications.urls")),

    path("api/admin/", include("users.admin_urls")),

    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),

]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)