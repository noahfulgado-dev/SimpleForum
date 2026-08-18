from allauth.account.adapter import DefaultAccountAdapter
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from django.conf import settings


class AccountAdapter(DefaultAccountAdapter):
    def send_mail(self, template_prefix, email, context):
        frontend_url = settings.LOGIN_REDIRECT_URL
        context['FRONTEND_URL'] = frontend_url.split(',')[0].strip()
        super().send_mail(template_prefix, email, context)


class SocialAccountAdapter(DefaultSocialAccountAdapter):
    def get_connect_redirect_url(self, request, socialaccount):
        return settings.LOGIN_REDIRECT_URL
