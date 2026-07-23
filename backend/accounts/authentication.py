from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken


class CookieJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        try:
            result = super().authenticate(request)
            if result is not None:
                return result
        except InvalidToken:
            pass

        raw_token = request.COOKIES.get("core-app-auth")
        if raw_token is None:
            return None

        try:
            validated_token = self.get_validated_token(raw_token)
        except InvalidToken:
            return None

        return self.get_user(validated_token), validated_token

    def get_header(self, request):
        header = super().get_header(request)
        if header is not None:
            return header
        raw_token = request.COOKIES.get("core-app-auth")
        if raw_token is not None:
            return f"Bearer {raw_token}".encode()
        return None
