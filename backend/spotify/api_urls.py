from django.urls import path

from spotify.views import NowPlayingView, SpotifyAuthorizeView

urlpatterns = [
    path('now-playing/', NowPlayingView.as_view(), name='now-playing'),
    path('authorize/', SpotifyAuthorizeView.as_view(), name='spotify-authorize'),
]