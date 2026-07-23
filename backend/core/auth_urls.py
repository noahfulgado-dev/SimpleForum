from django.urls import path, re_path
from django.views.generic import TemplateView

from dj_rest_auth.views import (
    LoginView, LogoutView, PasswordChangeView,
    PasswordResetConfirmView, PasswordResetView, UserDetailsView,
)
from dj_rest_auth.registration.views import (
    RegisterView, VerifyEmailView, ResendEmailVerificationView,
)
from rest_framework_simplejwt.views import TokenVerifyView
from dj_rest_auth.jwt_auth import get_refresh_view


class ScopedLoginView(LoginView):
    throttle_scope = "login"


class ScopedRegisterView(RegisterView):
    throttle_scope = "register"


auth_urlpatterns = [
    re_path(r'password/reset/?$', PasswordResetView.as_view(), name='rest_password_reset'),
    re_path(r'password/reset/confirm/?$', PasswordResetConfirmView.as_view(), name='rest_password_reset_confirm'),
    re_path(r'login/?$', ScopedLoginView.as_view(), name='rest_login'),
    re_path(r'logout/?$', LogoutView.as_view(), name='rest_logout'),
    re_path(r'user/?$', UserDetailsView.as_view(), name='rest_user_details'),
    re_path(r'password/change/?$', PasswordChangeView.as_view(), name='rest_password_change'),
    re_path(r'token/verify/?$', TokenVerifyView.as_view(), name='token_verify'),
    re_path(r'token/refresh/?$', get_refresh_view().as_view(), name='token_refresh'),
]

registration_urlpatterns = [
    path('', ScopedRegisterView.as_view(), name='rest_register'),
    re_path(r'verify-email/?$', VerifyEmailView.as_view(), name='rest_verify_email'),
    re_path(r'resend-email/?$', ResendEmailVerificationView.as_view(), name='rest_resend_email'),
    re_path(
        r'^account-confirm-email/(?P<key>[-:\w]+)/$',
        TemplateView.as_view(),
        name='account_confirm_email',
    ),
    re_path(
        r'account-email-verification-sent/?$',
        TemplateView.as_view(),
        name='account_email_verification_sent',
    ),
]
