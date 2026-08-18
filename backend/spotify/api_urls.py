from django.urls import path

from spotify.views import NowPlayingView

urlpatterns = [
    path('now-playing/', NowPlayingView.as_view(), name='now-playing'),
]