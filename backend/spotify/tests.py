from unittest import mock

from allauth.socialaccount.models import SocialAccount, SocialApp, SocialToken
from allauth.socialaccount.providers.base import ProviderException
from django.contrib.auth import get_user_model
from django.contrib.sites.models import Site
from django.core.cache import cache
from django.test import RequestFactory, TestCase
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from spotify.providers import SpotifyOAuth2AdapterExt

User = get_user_model()

TRACK_PAYLOAD = {
    "device": {"name": "MacBook"},
    "is_playing": True,
    "progress_ms": 42000,
    "shuffle_state": True,
    "repeat_state": "context",
    "item": {
        "name": "Golden Hour",
        "duration_ms": 192000,
        "preview_url": "https://p.scdn.co/mp3-preview/abc",
        "artists": [{"name": "Jvke"}, {"name": "Someone"}],
        "album": {"name": "This Is What Falling In Love Feels Like", "images": [
            {"url": "https://img/640", "width": 640, "height": 640},
            {"url": "https://img/300", "width": 300, "height": 300},
        ]},
    },
}

ME_PREMIUM = {"product": "premium"}


def mock_spotify(status=200, json_data=None, text=""):
    resp = mock.Mock(status_code=status, text=text)
    if json_data is not None:
        resp.json = mock.Mock(return_value=json_data)
    return resp


class NowPlayingAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='spotifyuser', password='testpass123')
        refresh = RefreshToken.for_user(self.user)
        self.access_token = str(refresh.access_token)
        self.app = SocialApp.objects.create(
            provider='spotify', name='Spotify', client_id='test-cid', secret='test-secret'
        )
        self.app.sites.add(Site.objects.get_current())
        self.account = SocialAccount.objects.create(
            user=self.user, provider='spotify', uid='spotify-uid'
        )
        self.token = SocialToken.objects.create(
            account=self.account, app=self.app, token='access-token', token_secret='refresh-token'
        )
        cache.clear()

    def auth(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')

    def test_requires_authentication(self):
        response = self.client.get('/api/spotify/now-playing/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_not_connected(self):
        self.user.socialaccount_set.all().delete()
        self.auth()
        response = self.client.get('/api/spotify/now-playing/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {"connected": False})

    def test_nothing_playing(self):
        self.auth()
        with mock.patch('spotify.views.requests.request', return_value=mock_spotify(204)):
            response = self.client.get('/api/spotify/now-playing/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data,
            {"connected": True, "playing": False, "premium": True},
        )

    def test_premium_unknown_defaults_to_controls(self):
        self.auth()
        with mock.patch('spotify.views.requests.request') as mock_request:
            mock_request.side_effect = [
                mock_spotify(429),
                mock_spotify(200, TRACK_PAYLOAD),
            ]
            response = self.client.get('/api/spotify/now-playing/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['premium'], True)
        self.assertIsNone(cache.get(f"spotify:premium:u{self.user.id}"))

    def test_playing_payload(self):
        self.auth()
        with mock.patch('spotify.views.requests.request') as mock_request:
            mock_request.return_value = mock_spotify(200, TRACK_PAYLOAD)
            response = self.client.get('/api/spotify/now-playing/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['playing'], True)
        self.assertEqual(response.data['title'], 'Golden Hour')
        self.assertEqual(response.data['artists'], ['Jvke', 'Someone'])
        self.assertEqual(response.data['album_art'], 'https://img/300')
        self.assertEqual(response.data['progress_ms'], 42000)
        self.assertEqual(response.data['duration_ms'], 192000)
        self.assertEqual(response.data['device'], 'MacBook')
        self.assertEqual(response.data['preview_url'], 'https://p.scdn.co/mp3-preview/abc')
        self.assertEqual(response.data['shuffle'], True)
        self.assertEqual(response.data['repeat'], 'context')

    def test_premium_flag_from_cache(self):
        cache.set(f"spotify:premium:u{self.user.id}", True, 86400)
        self.auth()
        with mock.patch('spotify.views.requests.request') as mock_request:
            mock_request.return_value = mock_spotify(200, TRACK_PAYLOAD)
            response = self.client.get('/api/spotify/now-playing/')
        self.assertEqual(response.data['premium'], True)
        me_calls = [
            c for c in mock_request.call_args_list
            if c.args[1] == 'https://api.spotify.com/v1/me'
        ]
        self.assertEqual(len(me_calls), 0)

    def test_premium_fetched_and_cached(self):
        self.auth()
        with mock.patch('spotify.views.requests.request') as mock_request:
            mock_request.side_effect = [
                mock_spotify(200, ME_PREMIUM),
                mock_spotify(200, TRACK_PAYLOAD),
            ]
            response = self.client.get('/api/spotify/now-playing/')
        self.assertEqual(response.data['premium'], True)
        self.assertEqual(cache.get(f"spotify:premium:u{self.user.id}"), True)

    def test_token_refresh_retry(self):
        self.auth()
        mock_request = mock.Mock()
        mock_request.side_effect = [
            mock_spotify(200, ME_PREMIUM),
            mock_spotify(401),
            mock_spotify(200, TRACK_PAYLOAD),
        ]
        mock_post = mock.Mock()
        mock_post.return_value = mock_spotify(
            200,
            {"access_token": "new-access", "expires_in": 3600},
        )
        with mock.patch('spotify.views.requests.request', mock_request), mock.patch('spotify.views.requests.post', mock_post):
            response = self.client.get('/api/spotify/now-playing/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Golden Hour')
        self.token.refresh_from_db()
        self.assertEqual(self.token.token, 'new-access')
        mock_post.assert_called_once()

    def test_rate_limited(self):
        self.auth()
        with mock.patch('spotify.views.requests.request') as mock_request:
            mock_request.return_value = mock_spotify(429)
            response = self.client.get('/api/spotify/now-playing/')
        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertEqual(response.data['error'], 'rate_limited')

    def test_cached_response_skips_network(self):
        self.auth()
        with mock.patch('spotify.views.requests.request') as mock_request:
            mock_request.return_value = mock_spotify(200, TRACK_PAYLOAD)
            self.client.get('/api/spotify/now-playing/')
            self.client.get('/api/spotify/now-playing/')
        self.assertEqual(mock_request.call_count, 2)

    def test_cache_isolated_per_user(self):
        other = User.objects.create_user(username='otheruser', password='testpass123')
        SocialAccount.objects.create(user=other, provider='spotify', uid='other-uid')
        SocialToken.objects.create(account=other.socialaccount_set.get(provider='spotify'), app=self.app, token='other-token')
        with mock.patch('spotify.views.requests.request') as mock_request:
            mock_request.return_value = mock_spotify(200, TRACK_PAYLOAD)
            self.auth()
            self.client.get('/api/spotify/now-playing/')
            refresh = RefreshToken.for_user(other)
            self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(refresh.access_token)}')
            self.client.get('/api/spotify/now-playing/')
        self.assertEqual(mock_request.call_count, 4)


class SpotifyProviderOverrideTest(TestCase):
    def setUp(self):
        self.app = SocialApp.objects.create(
            provider='spotify', name='Spotify', client_id='test-cid', secret='test-secret'
        )
        self.app.sites.add(Site.objects.get_current())

    def _adapter(self):
        self.request = RequestFactory().get('/accounts/spotify/login/callback/')
        return SpotifyOAuth2AdapterExt(self.request)

    def _patch_session(self, session):
        return mock.patch(
            'spotify.providers.get_adapter',
            return_value=mock.Mock(get_requests_session=mock.Mock(return_value=session)),
        )

    def test_profile_ok(self):
        session = mock.Mock()
        session.get.return_value = mock.Mock(
            status_code=200,
            json=lambda: {'id': 'spotify-uid', 'display_name': 'Tester', 'email': 't@example.com'},
        )
        adapter = self._adapter()
        with self._patch_session(session):
            login = adapter.complete_login(self.request, self.app, mock.Mock(token='access-token'))
        self.assertEqual(login.account.uid, 'spotify-uid')
        session.get.assert_called_once()
        headers = session.get.call_args.kwargs['headers']
        self.assertEqual(headers['Authorization'], 'Bearer access-token')

    def test_profile_error_raises_provider_exception(self):
        session = mock.Mock()
        session.get.return_value = mock.Mock(
            status_code=429, text='Rate limit has been reached',
        )
        adapter = self._adapter()
        with self._patch_session(session), self.assertRaises(ProviderException):
            adapter.complete_login(self.request, self.app, mock.Mock(token='access-token'))

    def test_profile_unauthorized_raises_provider_exception(self):
        session = mock.Mock()
        session.get.return_value = mock.Mock(status_code=401, text='The access token expired')
        adapter = self._adapter()
        with self._patch_session(session), self.assertRaises(ProviderException):
            adapter.complete_login(self.request, self.app, mock.Mock(token='access-token'))

    def test_provider_urlpatterns_include_spotify_routes(self):
        from django.urls import URLResolver
        from allauth.urls import build_provider_urlpatterns
        patterns = build_provider_urlpatterns()
        spotify = next(p for p in patterns if str(p.pattern) == 'spotify/')
        inner = [
            str(p.pattern)
            for p in spotify.url_patterns  # type: ignore[attr-defined]
            if isinstance(p, URLResolver)
        ] or [
            str(p.pattern)
            for p in spotify.url_patterns  # type: ignore[attr-defined]
        ]
        self.assertTrue('login/' in inner, inner)
        self.assertTrue('login/callback/' in inner, inner)


class SpotifyAuthorizeBridgeTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='bridgeuser', password='testpass123')
        self.refresh = RefreshToken.for_user(self.user)
        self.app = SocialApp.objects.create(
            provider='spotify', name='Spotify', client_id='test-cid', secret='test-secret'
        )
        self.app.sites.add(Site.objects.get_current())

    def test_requires_authentication(self):
        response = self.client.get('/api/spotify/authorize/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_redirects_directly_to_spotify_authorize(self):
        response = self.client.get(
            f'/api/spotify/authorize/?access={self.refresh.access_token}'
        )
        self.assertEqual(response.status_code, status.HTTP_302_FOUND)
        self.assertTrue(response.url.startswith('https://accounts.spotify.com/authorize'))
        self.assertIn('client_id=test-cid', response.url)
        self.assertIn('redirect_uri=http%3A%2F%2Ftestserver%2Fapi%2Fspotify%2Fcallback%2F', response.url)
        self.assertIn('scope=user-read-currently-playing+user-read-playback-state+user-modify-playback-state', response.url)
        self.assertIn('state=', response.url)

    def test_state_is_signed_with_user_id(self):
        from urllib.parse import unquote
        from django.core.signing import loads as signing_loads
        from spotify.views import STATE_SALT
        response = self.client.get(
            f'/api/spotify/authorize/?access={self.refresh.access_token}'
        )
        state = unquote(response.url.split('state=')[1])
        payload = signing_loads(state, salt=STATE_SALT)
        self.assertEqual(payload['uid'], self.user.id)

    def test_rejects_invalid_token(self):
        response = self.client.get('/api/spotify/authorize/?access=not-a-token')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_authenticates_via_http_only_cookie(self):
        from rest_framework_simplejwt.tokens import AccessToken
        access = AccessToken.for_user(self.user)
        response = self.client.get(
            '/api/spotify/authorize/', HTTP_COOKIE=f'core-app-auth={access}'
        )
        self.assertEqual(response.status_code, status.HTTP_302_FOUND)
        self.assertTrue(response.url.startswith('https://accounts.spotify.com/authorize'))


class SpotifyCallbackTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='cbuser', password='testpass123')
        self.app = SocialApp.objects.create(
            provider='spotify', name='Spotify', client_id='test-cid', secret='test-secret'
        )
        self.app.sites.add(Site.objects.get_current())
        from spotify.views import STATE_SALT
        from django.core.signing import dumps as signing_dumps
        self.state = signing_dumps({'uid': self.user.id}, salt=STATE_SALT)

    def _patch_exchange(self, token_data):
        return mock.patch(
            'spotify.views.requests.post',
            return_value=mock.Mock(status_code=200, json=lambda: token_data),
        )

    def _patch_profile(self, profile):
        return mock.patch(
            'spotify.views.requests.get',
            return_value=mock.Mock(status_code=200, json=lambda: profile),
        )

    def test_callback_links_token_and_redirects(self):
        token_data = {
            'access_token': 'access-token',
            'refresh_token': 'refresh-token',
            'expires_in': 3600,
        }
        profile = {'id': 'spotify-uid', 'display_name': 'Tester'}
        with self._patch_exchange(token_data), self._patch_profile(profile):
            response = self.client.get(
                f'/api/spotify/callback/?state={self.state}&code=auth-code'
            )
        self.assertEqual(response.status_code, status.HTTP_302_FOUND)
        from django.conf import settings
        self.assertEqual(response.url, settings.LOGIN_REDIRECT_URL)
        account = SocialAccount.objects.get(user=self.user, provider='spotify')
        self.assertEqual(account.uid, 'spotify-uid')
        token = SocialToken.objects.get(account=account)
        self.assertEqual(token.token, 'access-token')
        self.assertEqual(token.token_secret, 'refresh-token')
        self.assertEqual(token.app, self.app)
        self.assertEqual(cache.get(f"spotify:premium:u{self.user.id}"), False)

    def test_callback_requires_spotify_app(self):
        self.app.delete()
        with self._patch_exchange({'access_token': 't'}), self._patch_profile({'id': 'u'}):
            response = self.client.get(
                f'/api/spotify/callback/?state={self.state}&code=auth-code'
            )
        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)

    def test_callback_rejects_bad_state(self):
        response = self.client.get('/api/spotify/callback/?state=forged&code=auth-code')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_callback_rejects_expired_state(self):
        from spotify.views import STATE_MAX_AGE
        with mock.patch('spotify.views.STATE_MAX_AGE', -1):
            response = self.client.get(
                f'/api/spotify/callback/?state={self.state}&code=auth-code'
            )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_callback_rejects_missing_code(self):
        response = self.client.get(f'/api/spotify/callback/?state={self.state}')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_callback_rejects_failed_code_exchange(self):
        with mock.patch(
            'spotify.views.requests.post',
            return_value=mock.Mock(status_code=400, text='bad request'),
        ):
            response = self.client.get(
                f'/api/spotify/callback/?state={self.state}&code=auth-code'
            )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class SpotifyControlTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='ctrluser', password='testpass123')
        refresh = RefreshToken.for_user(self.user)
        self.access_token = str(refresh.access_token)
        self.app = SocialApp.objects.create(
            provider='spotify', name='Spotify', client_id='test-cid', secret='test-secret'
        )
        self.app.sites.add(Site.objects.get_current())
        self.account = SocialAccount.objects.create(
            user=self.user, provider='spotify', uid='spotify-uid'
        )
        self.token = SocialToken.objects.create(
            account=self.account, app=self.app, token='access-token', token_secret='refresh-token'
        )
        cache.clear()

    def auth(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')

    def _patch_request(self, status=202, text=''):
        return mock.patch(
            'spotify.views.requests.request',
            return_value=mock_spotify(status, text=text),
        )

    def _last_call(self, mock_request):
        return mock_request.call_args_list[-1]

    def test_requires_authentication(self):
        response = self.client.post('/api/spotify/control/', {'action': 'play'})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_not_connected(self):
        self.user.socialaccount_set.all().delete()
        self.auth()
        response = self.client.post('/api/spotify/control/', {'action': 'play'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['code'], 'not_connected')

    def test_unknown_action(self):
        self.auth()
        response = self.client.post('/api/spotify/control/', {'action': 'hack'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_play(self):
        self.auth()
        with self._patch_request() as mock_request:
            response = self.client.post('/api/spotify/control/', {'action': 'play'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {'ok': True})
        method, url = self._last_call(mock_request).args[0], self._last_call(mock_request).args[1]
        self.assertEqual(method, 'put')
        self.assertEqual(url, 'https://api.spotify.com/v1/me/player/play')

    def test_play_with_position(self):
        self.auth()
        with self._patch_request() as mock_request:
            response = self.client.post(
                '/api/spotify/control/', {'action': 'play', 'position_ms': 5000},
                format='json',
            )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(self._last_call(mock_request).kwargs['json'], {'position_ms': 5000})

    def test_play_with_bad_position(self):
        self.auth()
        with self._patch_request() as mock_request:
            response = self.client.post(
                '/api/spotify/control/', {'action': 'play', 'position_ms': -1}
            )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_pause(self):
        self.auth()
        with self._patch_request() as mock_request:
            response = self.client.post('/api/spotify/control/', {'action': 'pause'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        method, url = self._last_call(mock_request).args
        self.assertEqual(method, 'put')
        self.assertEqual(url, 'https://api.spotify.com/v1/me/player/pause')

    def test_next_and_previous(self):
        self.auth()
        with self._patch_request() as mock_request:
            self.client.post('/api/spotify/control/', {'action': 'next'})
            self.client.post('/api/spotify/control/', {'action': 'previous'})
        urls = [c.args[1] for c in mock_request.call_args_list]
        self.assertEqual(urls, [
            'https://api.spotify.com/v1/me/player/next',
            'https://api.spotify.com/v1/me/player/previous',
        ])
        self.assertEqual(mock_request.call_args_list[0].args[0], 'post')
        self.assertEqual(mock_request.call_args_list[1].args[0], 'post')

    def test_seek(self):
        self.auth()
        with self._patch_request() as mock_request:
            response = self.client.post(
                '/api/spotify/control/', {'action': 'seek', 'position_ms': 60000},
                format='json',
            )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        call = self._last_call(mock_request)
        self.assertEqual(call.args[1], 'https://api.spotify.com/v1/me/player/seek')
        self.assertEqual(call.kwargs['params'], {'position_ms': 60000})

    def test_seek_requires_position(self):
        self.auth()
        with self._patch_request() as mock_request:
            response = self.client.post('/api/spotify/control/', {'action': 'seek'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_volume(self):
        self.auth()
        with self._patch_request() as mock_request:
            response = self.client.post(
                '/api/spotify/control/', {'action': 'volume', 'volume_percent': 42},
                format='json',
            )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        call = self._last_call(mock_request)
        self.assertEqual(call.args[1], 'https://api.spotify.com/v1/me/player/volume')
        self.assertEqual(call.kwargs['params'], {'volume_percent': 42})

    def test_volume_out_of_range(self):
        self.auth()
        with self._patch_request() as mock_request:
            response = self.client.post(
                '/api/spotify/control/', {'action': 'volume', 'volume_percent': 101}
            )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_shuffle(self):
        self.auth()
        with self._patch_request() as mock_request:
            response = self.client.post('/api/spotify/control/', {'action': 'shuffle', 'state': True}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        call = self._last_call(mock_request)
        self.assertEqual(call.args[1], 'https://api.spotify.com/v1/me/player/shuffle')
        self.assertEqual(call.kwargs['params'], {'state': 'true'})

    def test_repeat(self):
        self.auth()
        with self._patch_request() as mock_request:
            response = self.client.post(
                '/api/spotify/control/', {'action': 'repeat', 'state': 'track'}
            )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        call = self._last_call(mock_request)
        self.assertEqual(call.args[1], 'https://api.spotify.com/v1/me/player/repeat')
        self.assertEqual(call.kwargs['params'], {'state': 'track'})

    def test_repeat_bad_state(self):
        self.auth()
        response = self.client.post('/api/spotify/control/', {'action': 'repeat', 'state': 'loud'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_premium_required_clears_premium_cache(self):
        cache.set(f"spotify:premium:u{self.user.id}", True, 86400)
        self.auth()
        with self._patch_request(403, text='Player command failed: Premium required') as mock_request:
            response = self.client.post('/api/spotify/control/', {'action': 'play'})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data['code'], 'premium_required')
        self.assertIsNone(cache.get(f"spotify:premium:u{self.user.id}"))

    def test_insufficient_scope_maps_to_reconnect(self):
        self.auth()
        with self._patch_request(403, text='Insufficient client scope') as mock_request:
            response = self.client.post('/api/spotify/control/', {'action': 'play'})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data['code'], 'reconnect_required')

    def test_no_device(self):
        self.auth()
        with self._patch_request(404, text='Device not found') as mock_request:
            response = self.client.post('/api/spotify/control/', {'action': 'play'})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['code'], 'no_device')

    def test_refresh_retry_on_control(self):
        self.auth()
        mock_request = mock.Mock()
        mock_request.side_effect = [mock_spotify(401), mock_spotify(202)]
        mock_post = mock.Mock()
        mock_post.return_value = mock_spotify(
            200, {"access_token": "new-access", "expires_in": 3600}
        )
        with mock.patch('spotify.views.requests.request', mock_request), mock.patch('spotify.views.requests.post', mock_post):
            response = self.client.post('/api/spotify/control/', {'action': 'play'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.token.refresh_from_db()
        self.assertEqual(self.token.token, 'new-access')


class SocialAccountAdapterRedirectTest(TestCase):
    def test_connect_redirect_url_is_frontend(self):
        from django.conf import settings
        from django.test import RequestFactory
        from accounts.adapters import SocialAccountAdapter
        adapter = SocialAccountAdapter()
        url = adapter.get_connect_redirect_url(
            RequestFactory().get('/'), mock.Mock()
        )
        self.assertEqual(url, settings.LOGIN_REDIRECT_URL)