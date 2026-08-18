from django.urls import path

from spotify.views import NowPlayingView, SpotifyAuthorizeView, SpotifyCallbackView, SpotifyControlView

urlpatterns = [
    path('now-playing/', NowPlayingView.as_view(), name='now-playing'),
    path('authorize/', SpotifyAuthorizeView.as_view(), name='spotify-authorize'),
    path('callback/', SpotifyCallbackView.as_view(), name='spotify-callback'),
    path('control/', SpotifyControlView.as_view(), name='spotify-control'),
]