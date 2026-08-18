from datetime import timedelta

import requests
from allauth.socialaccount.models import SocialAccount, SocialApp, SocialToken
from allauth.socialaccount.providers.oauth2.views import OAuth2CallbackView, OAuth2LoginView
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.core.signing import BadSignature, SignatureExpired, dumps, loads
from django.http import HttpResponseRedirect
from django.urls import reverse
from django.utils import timezone
from urllib.parse import urlencode
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.authentication import CookieJWTAuthentication
from spotify.providers import SpotifyOAuth2AdapterExt

SPOTIFY_NOW_PLAYING_URL = "https://api.spotify.com/v1/me/player/currently-playing"
SPOTIFY_PLAYER_URL = "https://api.spotify.com/v1/me/player"
SPOTIFY_ME_URL = "https://api.spotify.com/v1/me"
SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token"
SPOTIFY_AUTHORIZE_URL = "https://accounts.spotify.com/authorize"
SPOTIFY_SCOPE = "user-read-currently-playing user-read-playback-state user-modify-playback-state"
STATE_SALT = "spotify-connect-state"
STATE_MAX_AGE = 600
CACHE_PREFIX = "spotify:now_playing:u"
CACHE_TTL = 20
PREMIUM_KEY = "spotify:premium:u{}"
PREMIUM_TTL = 86400


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


def _api_call(method, url, token, **kwargs):
    resp = requests.request(
        method,
        url,
        headers={"Authorization": f"Bearer {token.token}"},
        timeout=10,
        **kwargs,
    )
    if resp.status_code == 401 and _refresh_token(token):
        resp = requests.request(
            method,
            url,
            headers={"Authorization": f"Bearer {token.token}"},
            timeout=10,
            **kwargs,
        )
    return resp


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
        "shuffle": bool(data.get("shuffle_state")),
        "repeat": data.get("repeat_state") or "off",
    }


def _fetch_now_playing(token):
    resp = _api_call("get", SPOTIFY_NOW_PLAYING_URL, token)
    if resp.status_code in (204, 404):
        return {"connected": True, "playing": False}
    if resp.status_code == 429:
        return {"error": "rate_limited"}
    if resp.status_code != 200:
        return {"error": f"spotify_error_{resp.status_code}"}
    return _build_payload(resp.json())


def _get_premium(user, token):
    key = PREMIUM_KEY.format(user.id)
    value = cache.get(key)
    if value is not None:
        return value
    try:
        resp = _api_call("get", SPOTIFY_ME_URL, token)
    except requests.RequestException:
        return None
    if resp.status_code != 200:
        return None
    value = resp.json().get("product") == "premium"
    cache.set(key, value, PREMIUM_TTL)
    return value


class NowPlayingView(APIView):
    def get(self, request):
        token = _get_token(request.user)
        if token is None:
            return Response({"connected": False})

        premium = _get_premium(request.user, token)
        if premium is None:
            # Couldn't determine account tier; assume Premium so controls
            # show. A free account's first control call gets 403 → the
            # premium cache is cleared → next poll downgrades the card.
            premium = True
        key = f"{CACHE_PREFIX}{request.user.id}"
        payload = cache.get(key)
        if payload is None:
            payload = _fetch_now_playing(token)
            if "error" not in payload:
                cache.set(key, payload, CACHE_TTL)
        if "error" in payload:
            return Response(payload, status=503)
        payload["premium"] = premium
        return Response(payload)


class SpotifyAuthorizeView(APIView):
    """Start the Spotify connect flow for the JWT-authenticated user.

    Cookie/session-free: authenticates via JWT, signs a short-lived state
    token embedding the user id, and redirects straight to Spotify's
    official authorize page. The callback verifies the state and exchanges
    the code server-side, so no server session has to survive the
    cross-site round trip (Firefox Total Cookie Protection / Safari ITP).
    """

    authentication_classes = []
    permission_classes = []
    throttle_classes = []

    def get(self, request):
        user = self._resolve_user(request)
        if user is None:
            return Response(
                {"detail": "Authentication credentials were not provided."},
                status=401,
            )
        app = SocialApp.objects.filter(provider="spotify").first()
        if app is None:
            return Response(
                {"detail": "Spotify app is not configured."}, status=503
            )
        state = dumps({"uid": user.id}, salt=STATE_SALT)
        redirect_uri = request.build_absolute_uri(reverse("spotify-callback"))
        params = {
            "client_id": app.client_id,
            "response_type": "code",
            "redirect_uri": redirect_uri,
            "scope": SPOTIFY_SCOPE,
            "state": state,
        }
        return HttpResponseRedirect(
            f"{SPOTIFY_AUTHORIZE_URL}?{urlencode(params)}"
        )

    def _resolve_user(self, request):
        cookie_auth = CookieJWTAuthentication()
        try:
            result = cookie_auth.authenticate(request)
            if result is not None:
                return result[0]
        except Exception:
            pass
        raw = request.query_params.get("access")
        if raw:
            try:
                token = cookie_auth.get_validated_token(raw)
                return cookie_auth.get_user(token)
            except Exception:
                return None
        return None


class SpotifyCallbackView(APIView):
    """Handle the Spotify OAuth callback without any session state."""

    authentication_classes = []
    permission_classes = []
    throttle_classes = []

    def get(self, request):
        state = request.query_params.get("state", "")
        try:
            payload = loads(state, salt=STATE_SALT, max_age=STATE_MAX_AGE)
        except (BadSignature, SignatureExpired):
            return Response({"detail": "Invalid or expired state."}, status=400)

        user_id = payload.get("uid")
        User = get_user_model()
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=400)

        app = SocialApp.objects.filter(provider="spotify").first()
        if app is None:
            return Response({"detail": "Spotify app is not configured."}, status=503)

        code = request.query_params.get("code")
        if not code:
            return Response({"detail": "Missing authorization code."}, status=400)

        redirect_uri = request.build_absolute_uri(reverse("spotify-callback"))
        token_data = _exchange_code(app, code, redirect_uri)
        if token_data is None:
            return Response(
                {"detail": "Failed to exchange authorization code."}, status=400
            )

        access_token = token_data["access_token"]
        profile = _fetch_profile(access_token)
        if profile is None:
            return Response({"detail": "Failed to fetch Spotify profile."}, status=400)
        cache.set(
            PREMIUM_KEY.format(user.id),
            profile.get("product") == "premium",
            PREMIUM_TTL,
        )

        account, _ = SocialAccount.objects.get_or_create(
            user=user, provider="spotify", uid=profile["id"]
        )
        token, _ = SocialToken.objects.update_or_create(
            account=account,
            defaults={
                "app": app,
                "token": access_token,
                "token_secret": token_data.get("refresh_token", ""),
                "expires_at": timezone.now()
                + timedelta(seconds=token_data.get("expires_in", 3600)),
            },
        )
        token.save()
        cache.delete(f"{CACHE_PREFIX}{user.id}")
        return HttpResponseRedirect(settings.LOGIN_REDIRECT_URL)


class SpotifyControlView(APIView):
    """Forward playback control commands to the Spotify Web API.

    Requires a Premium account; free accounts are served a read-only card
    (controls stay hidden on the frontend via the now-playing `premium` flag).
    """

    throttle_scope = "spotify_control"

    def post(self, request):
        token = _get_token(request.user)
        if token is None:
            return Response(
                {"detail": "No Spotify account linked.", "code": "not_connected"},
                status=400,
            )

        action = request.data.get("action")
        base = SPOTIFY_PLAYER_URL
        method = "put"
        url = base
        params = {}
        body = {}

        if action == "play":
            url = f"{base}/play"
            position_ms = request.data.get("position_ms")
            if position_ms is not None:
                if not isinstance(position_ms, int) or position_ms < 0:
                    return Response({"detail": "Invalid position_ms."}, status=400)
                body["position_ms"] = position_ms
        elif action == "pause":
            url = f"{base}/pause"
        elif action == "next":
            url = f"{base}/next"
            method = "post"
        elif action == "previous":
            url = f"{base}/previous"
            method = "post"
        elif action == "seek":
            position_ms = request.data.get("position_ms")
            if not isinstance(position_ms, int) or position_ms < 0:
                return Response({"detail": "Invalid position_ms."}, status=400)
            url = f"{base}/seek"
            params["position_ms"] = position_ms
        elif action == "volume":
            volume = request.data.get("volume_percent")
            if not isinstance(volume, int) or not 0 <= volume <= 100:
                return Response({"detail": "Invalid volume_percent."}, status=400)
            url = f"{base}/volume"
            params["volume_percent"] = volume
        elif action == "shuffle":
            state = request.data.get("state")
            if state not in (True, False):
                return Response({"detail": "Invalid state."}, status=400)
            url = f"{base}/shuffle"
            params["state"] = "true" if state else "false"
        elif action == "repeat":
            state = request.data.get("state")
            if state not in ("track", "context", "off"):
                return Response({"detail": "Invalid repeat state."}, status=400)
            url = f"{base}/repeat"
            params["state"] = state
        else:
            return Response({"detail": "Unknown action."}, status=400)

        resp = _api_call(method, url, token, params=params, json=body)
        if resp.status_code in (202, 204):
            return Response({"ok": True})

        text = (resp.text or "").lower()
        if resp.status_code == 403:
            if "insufficient client scope" in text:
                return Response(
                    {"detail": "Reconnect Spotify to unlock controls.", "code": "reconnect_required"},
                    status=403,
                )
            if "premium" in text:
                cache.delete(PREMIUM_KEY.format(request.user.id))
                return Response(
                    {"detail": "Spotify Premium required for controls.", "code": "premium_required"},
                    status=403,
                )
            return Response(
                {"detail": "Spotify rejected the command.", "code": "player_command_failed"},
                status=403,
            )
        if resp.status_code == 404:
            return Response(
                {"detail": "No active Spotify device.", "code": "no_device"},
                status=404,
            )
        return Response(
            {"detail": f"Spotify error {resp.status_code}.", "code": f"spotify_error_{resp.status_code}"},
            status=503,
        )


def _exchange_code(app, code, redirect_uri):
    resp = requests.post(
        SPOTIFY_TOKEN_URL,
        data={
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": redirect_uri,
        },
        auth=(app.client_id, app.secret),
        timeout=10,
    )
    if resp.status_code != 200:
        return None
    return resp.json()


def _fetch_profile(access_token):
    resp = requests.get(
        SPOTIFY_ME_URL,
        headers={"Authorization": f"Bearer {access_token}"},
        timeout=10,
    )
    if resp.status_code != 200:
        return None
    return resp.json()


oauth2_login = OAuth2LoginView.adapter_view(SpotifyOAuth2AdapterExt)
oauth2_callback = OAuth2CallbackView.adapter_view(SpotifyOAuth2AdapterExt)