from allauth.account.adapter import DefaultAccountAdapter
from django.conf import settings


class AccountAdapter(DefaultAccountAdapter):
    def send_mail(self, template_prefix, email, context):
        frontend_url = settings.LOGIN_REDIRECT_URL
        context['FRONTEND_URL'] = frontend_url.split(',')[0].strip()
        super().send_mail(template_prefix, email, context)
