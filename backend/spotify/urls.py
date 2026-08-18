from allauth.socialaccount.providers.oauth2.urls import default_urlpatterns

from spotify.providers import SpotifyProvider

urlpatterns = default_urlpatterns(SpotifyProvider)