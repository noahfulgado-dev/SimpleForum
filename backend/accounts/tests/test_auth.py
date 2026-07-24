from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import Follow

User = get_user_model()


class AuthenticationTest(TestCase):
    """Test authentication endpoints."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self._throttle_patches = [
            patch('rest_framework.throttling.ScopedRateThrottle.allow_request', return_value=True),
            patch('rest_framework.throttling.AnonRateThrottle.allow_request', return_value=True),
            patch('rest_framework.throttling.UserRateThrottle.allow_request', return_value=True),
        ]
        for p in self._throttle_patches:
            p.start()

    def tearDown(self):
        for p in self._throttle_patches:
            p.stop()

    def test_user_registration(self):
        """Test user registration."""
        response = self.client.post('/auth/registration/', {
            'username': 'newuser',
            'email': 'new@example.com',
            'password1': 'newpass123',
            'password2': 'newpass123'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username='newuser').exists())

    def test_user_login(self):
        """Test user login with email."""
        response = self.client.post('/auth/login/', {
            'email': 'test@example.com',
            'password': 'testpass123'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)

    def test_user_login_invalid_credentials(self):
        """Test login with invalid credentials."""
        response = self.client.post('/auth/login/', {
            'email': 'test@example.com',
            'password': 'wrongpassword'
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_token_refresh(self):
        """Test token refresh with valid refresh token."""
        login_response = self.client.post('/auth/login/', {
            'email': 'test@example.com',
            'password': 'testpass123'
        })
        refresh = login_response.data.get('refresh')

        response = self.client.post('/auth/token/refresh/', {
            'refresh': refresh
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)

    def test_get_user_profile_authenticated(self):
        """Test getting user profile with authentication."""
        login_response = self.client.post('/auth/login/', {
            'email': 'test@example.com',
            'password': 'testpass123'
        })
        token = login_response.data.get('access')

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        response = self.client.get('/api/users/me/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'testuser')

    def test_get_user_profile_unauthenticated(self):
        """Test getting user profile without authentication."""
        response = self.client.get('/api/users/me/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_sets_auth_cookie(self):
        """Test login response sets httpOnly auth cookie."""
        response = self.client.post('/auth/login/', {
            'email': 'test@example.com',
            'password': 'testpass123'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('core-app-auth', response.cookies)
        self.assertIn('core-refresh-token', response.cookies)

    def test_cookie_authentication(self):
        """Test authenticating via httpOnly cookie instead of Authorization header."""
        login_resp = self.client.post('/auth/login/', {
            'email': 'test@example.com',
            'password': 'testpass123'
        })
        self.client.cookies['core-app-auth'] = login_resp.data['access']
        self.client.credentials()  # Clear any Authorization header
        response = self.client.get('/api/users/me/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'testuser')

    def test_cookie_authentication_invalid(self):
        """Test that invalid cookie value does not authenticate."""
        self.client.cookies['core-app-auth'] = 'invalid-token'
        response = self.client.get('/api/users/me/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class FollowAPITest(TestCase):
    """Test Follow API endpoints."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.target = User.objects.create_user(
            username='targetuser',
            email='target@example.com',
            password='targetpass123'
        )
        refresh = RefreshToken.for_user(self.user)
        self.access_token = str(refresh.access_token)

    def test_follow_user(self):
        """Test following a user."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        response = self.client.post(f'/api/users/{self.target.id}/follow/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get('status'), 'followed')
        self.assertEqual(response.data.get('follower_count'), 1)
        self.assertTrue(
            Follow.objects.filter(follower=self.user, following=self.target).exists()
        )

    def test_unfollow_user(self):
        """Test unfollowing a user."""
        Follow.objects.create(follower=self.user, following=self.target)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        response = self.client.post(f'/api/users/{self.target.id}/follow/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get('status'), 'unfollowed')
        self.assertEqual(response.data.get('follower_count'), 0)

    def test_cannot_follow_self(self):
        """Test users cannot follow themselves."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        response = self.client.post(f'/api/users/{self.user.id}/follow/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data.get('error'), 'You cannot follow yourself.')

    def test_follow_nonexistent_user(self):
        """Test following a non-existent user returns 404."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        response = self.client.post('/api/users/99999/follow/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_follow_unauthenticated(self):
        """Test unauthenticated users cannot follow."""
        response = self.client.post(f'/api/users/{self.target.id}/follow/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_follower_count_increases(self):
        """Test follower count increases when multiple users follow."""
        other_user = User.objects.create_user(
            username='otheruser',
            email='other@example.com',
            password='otherpass123'
        )
        other_refresh = RefreshToken.for_user(other_user)
        other_token = str(other_refresh.access_token)

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        self.client.post(f'/api/users/{self.target.id}/follow/')

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {other_token}')
        response = self.client.post(f'/api/users/{self.target.id}/follow/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get('follower_count'), 2)

    def test_user_detail_includes_follow_counts(self):
        """Test user detail includes follower/following counts."""
        Follow.objects.create(follower=self.user, following=self.target)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        response = self.client.get(f'/api/users/{self.target.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['follower_count'], 1)
        self.assertEqual(response.data['following_count'], 0)

    def test_user_detail_is_following_true(self):
        """Test is_following is true when current user follows."""
        Follow.objects.create(follower=self.user, following=self.target)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        response = self.client.get(f'/api/users/{self.target.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['is_following'])

    def test_user_detail_is_following_false(self):
        """Test is_following is false when not following."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        response = self.client.get(f'/api/users/{self.target.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['is_following'])
