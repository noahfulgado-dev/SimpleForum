from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status

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
