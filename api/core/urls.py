from django.urls import include, path
from django.contrib import admin
from users.views import (
    ProfileView, 
    RegisterView, 
    LoginStep1View,
    LoginStep2View  
)
from dj_rest_auth.registration.views import SocialLoginView
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter

class GoogleLoginView(SocialLoginView):
    adapter_class = GoogleOAuth2Adapter

urlpatterns = [
    path('admin/', admin.site.urls),


    path('api/auth/login/', LoginStep1View.as_view(), name='login_step1'),
    path('api/auth/login/verify/', LoginStep2View.as_view(), name='login_step2'),

    path('api/profile/', ProfileView.as_view(), name='profile'),
    path('api/register/', RegisterView.as_view(), name='register'),

    path('api/auth/', include('dj_rest_auth.urls')),
    path('api/auth/registration/', include('dj_rest_auth.registration.urls')),
    
    path('api/auth/social/google/', GoogleLoginView.as_view()),
]