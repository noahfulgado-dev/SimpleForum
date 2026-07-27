from allauth.account.adapter import DefaultAccountAdapter
from django.conf import settings


class AccountAdapter(DefaultAccountAdapter):
    def send_mail(self, template_prefix, email, context):
        context['FRONTEND_URL'] = settings.LOGIN_REDIRECT_URL
        super().send_mail(template_prefix, email, context)
