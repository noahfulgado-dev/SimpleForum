from datetime import timedelta

import requests
from allauth.socialaccount.models import SocialAccount, SocialApp, SocialToken
from allauth.socialaccount.providers.oauth2.views import OAuth2CallbackView, OAuth2LoginView
from django.core.cache import cache
from django.utils import timezone
from rest_framework.response import Response
from rest_framework.views import APIView

from spotify.providers import SpotifyOAuth2AdapterExt

SPOTIFY_NOW_PLAYING_URL = "https://api.spotify.com/v1/me/player/currently-playing"
SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token"
CACHE_PREFIX = "spotify:now_playing:u"
CACHE_TTL = 20


def _get_token(user):
    account = SocialAccount.objects.filter(user=user, provider="spotify").first()
    if account is None:
        return None
    return SocialToken.objects.filter(account=account).first()


def _refresh_token(token):
    app = SocialApp.objects.filter(provider="spotify").first()
    if app is None or not token.token_secret:
        return False
    resp = requests.post(
        SPOTIFY_TOKEN_URL,
        data={
            "grant_type": "refresh_token",
            "refresh_token": token.token_secret,
        },
        auth=(app.client_id, app.secret),
        timeout=10,
    )
    if resp.status_code != 200:
        return False
    data = resp.json()
    token.token = data["access_token"]
    token.expires_at = timezone.now() + timedelta(seconds=data.get("expires_in", 3600))
    if data.get("refresh_token"):
        token.token_secret = data["refresh_token"]
    token.save()
    return True


def _build_payload(data):
    item = data.get("item")
    if item is None:
        return {"connected": True, "playing": False}
    album = item.get("album") or {}
    images = album.get("images") or []
    album_art = images[1]["url"] if len(images) > 1 else (images[0]["url"] if images else "")
    return {
        "connected": True,
        "playing": True,
        "title": item.get("name"),
        "artists": [a.get("name") for a in (item.get("artists") or [])],
        "album": album.get("name"),
        "album_art": album_art,
        "progress_ms": data.get("progress_ms", 0),
        "duration_ms": item.get("duration_ms", 0),
        "is_playing": data.get("is_playing", False),
        "device": (data.get("device") or {}).get("name"),
        "preview_url": item.get("preview_url"),
    }


def _fetch_now_playing(token):
    resp = requests.get(
        SPOTIFY_NOW_PLAYING_URL,
        headers={"Authorization": f"Bearer {token.token}"},
        timeout=10,
    )
    if resp.status_code == 401 and _refresh_token(token):
        resp = requests.get(
            SPOTIFY_NOW_PLAYING_URL,
            headers={"Authorization": f"Bearer {token.token}"},
            timeout=10,
        )
    if resp.status_code in (204, 404):
        return {"connected": True, "playing": False}
    if resp.status_code == 429:
        return {"error": "rate_limited"}
    if resp.status_code != 200:
        return {"error": f"spotify_error_{resp.status_code}"}
    return _build_payload(resp.json())


class NowPlayingView(APIView):
    def get(self, request):
        token = _get_token(request.user)
        if token is None:
            return Response({"connected": False})

        key = f"{CACHE_PREFIX}{request.user.id}"
        payload = cache.get(key)
        if payload is None:
            payload = _fetch_now_playing(token)
            if "error" not in payload:
                cache.set(key, payload, CACHE_TTL)
        if "error" in payload:
            return Response(payload, status=503)
        return Response(payload)


oauth2_login = OAuth2LoginView.adapter_view(SpotifyOAuth2AdapterExt)
oauth2_callback = OAuth2CallbackView.adapter_view(SpotifyOAuth2AdapterExt)