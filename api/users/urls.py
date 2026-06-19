from django.urls import path
from .views import (
    LoginStep1View,
    LoginStep2View,
    ProfileView,
    RegisterView,
    DailyBonusView,
    WheelView,
    WheelSpinView,
    OnboardingCompleteView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginStep1View.as_view(), name='login-step1'),
    path('login/verify/', LoginStep2View.as_view(), name='login-step2'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('daily-bonus/', DailyBonusView.as_view(), name='daily-bonus'),
    path('wheel/', WheelView.as_view(), name='wheel'),
    path('wheel/spin/', WheelSpinView.as_view(), name='wheel-spin'),
    path('onboarding/complete/', OnboardingCompleteView.as_view(), name='onboarding-complete'),
]