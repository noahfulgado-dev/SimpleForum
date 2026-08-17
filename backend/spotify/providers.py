import logging

from allauth.socialaccount.adapter import get_adapter
from allauth.socialaccount.providers.spotify.provider import SpotifyOAuth2Provider
from allauth.socialaccount.providers.spotify.views import SpotifyOAuth2Adapter

logger = logging.getLogger(__name__)


class SpotifyOAuth2AdapterExt(SpotifyOAuth2Adapter):
    """Spotify deprecated query-string token auth; use the Authorization
    header and surface API errors as a friendly auth failure instead of
    crashing with a KeyError on the error body."""

    def complete_login(self, request, app, token, **kwargs):
        resp = (
            get_adapter()
            .get_requests_session()
            .get(
                self.profile_url,
                headers={"Authorization": f"Bearer {token.token}"},
            )
        )
        if resp.status_code != 200:
            logger.warning(
                "Spotify profile request failed: %s %s",
                resp.status_code,
                resp.text[:300],
            )
            from allauth.socialaccount.providers.base import ProviderException

            raise ProviderException(
                f"Spotify profile request failed ({resp.status_code}): {resp.text[:200]}"
            )
        return self.get_provider().sociallogin_from_response(request, resp.json())


class SpotifyProvider(SpotifyOAuth2Provider):
    id = "spotify"
    oauth2_adapter_class = SpotifyOAuth2AdapterExt

    def extract_uid(self, data):
        uid = data.get("id")
        if not uid:
            from allauth.socialaccount.providers.base import ProviderException

            raise ProviderException("Spotify response contained no user id")
        return uid
