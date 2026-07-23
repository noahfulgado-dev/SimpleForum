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
