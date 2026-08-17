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
        with mock.patch('spotify.views.requests.get') as mock_get:
            mock_get.return_value = mock.Mock(status_code=204)
            response = self.client.get('/api/spotify/now-playing/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {"connected": True, "playing": False})

    def test_playing_payload(self):
        self.auth()
        with mock.patch('spotify.views.requests.get') as mock_get:
            mock_get.return_value = mock.Mock(status_code=200, json=lambda: TRACK_PAYLOAD)
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

    def test_token_refresh_retry(self):
        self.auth()
        mock_get = mock.Mock()
        mock_get.side_effect = [
            mock.Mock(status_code=401),
            mock.Mock(status_code=200, json=lambda: TRACK_PAYLOAD),
        ]
        mock_post = mock.Mock()
        mock_post.return_value = mock.Mock(
            status_code=200,
            json=lambda: {"access_token": "new-access", "expires_in": 3600},
        )
        with mock.patch('spotify.views.requests.get', mock_get), mock.patch('spotify.views.requests.post', mock_post):
            response = self.client.get('/api/spotify/now-playing/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Golden Hour')
        self.token.refresh_from_db()
        self.assertEqual(self.token.token, 'new-access')
        mock_post.assert_called_once()

    def test_rate_limited(self):
        self.auth()
        with mock.patch('spotify.views.requests.get') as mock_get:
            mock_get.return_value = mock.Mock(status_code=429)
            response = self.client.get('/api/spotify/now-playing/')
        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertEqual(response.data['error'], 'rate_limited')

    def test_cached_response_skips_network(self):
        self.auth()
        with mock.patch('spotify.views.requests.get') as mock_get:
            mock_get.return_value = mock.Mock(status_code=200, json=lambda: TRACK_PAYLOAD)
            self.client.get('/api/spotify/now-playing/')
            self.client.get('/api/spotify/now-playing/')
        self.assertEqual(mock_get.call_count, 1)

    def test_cache_isolated_per_user(self):
        other = User.objects.create_user(username='otheruser', password='testpass123')
        SocialAccount.objects.create(user=other, provider='spotify', uid='other-uid')
        SocialToken.objects.create(account=other.socialaccount_set.get(provider='spotify'), app=self.app, token='other-token')
        with mock.patch('spotify.views.requests.get') as mock_get:
            mock_get.return_value = mock.Mock(status_code=200, json=lambda: TRACK_PAYLOAD)
            self.auth()
            self.client.get('/api/spotify/now-playing/')
            refresh = RefreshToken.for_user(other)
            self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(refresh.access_token)}')
            self.client.get('/api/spotify/now-playing/')
        self.assertEqual(mock_get.call_count, 2)


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