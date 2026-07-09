from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    LoginView,
    PasswordResetConfirmView,
    PasswordResetView,
    TwoFAConfirmView,
    TwoFAEnableView,
    TwoFALoginVerifyView,
    UserRegistrationView,
)


urlpatterns = [
    path('register/', UserRegistrationView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('login/verify-2fa/', TwoFALoginVerifyView.as_view(), name='login_verify_2fa'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('password-reset/', PasswordResetView.as_view(), name='password_reset'),
    path('password-reset-confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('2fa/enable/', TwoFAEnableView.as_view(), name='2fa_enable'),
    path('2fa/confirm/', TwoFAConfirmView.as_view(), name='2fa_confirm'),
]
