from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status


class AuthenticationTest(TestCase):
    """Test authentication endpoints."""
    
    def setUp(self):
        self.client = APIClient()
        # Add username (required by Django's default User model)
        self.user = User.objects.create_user(
            username='testuser',  #  ADD THIS
            email='test@example.com',
            password='testpass123'
        )
        print(f"Test user created: {self.user.username}")
    
    def test_user_registration(self):
        """Test user registration."""
        response = self.client.post('/auth/registration/', {
            'username': 'newuser',
            'email': 'new@example.com',
            'password1': 'newpass123',
            'password2': 'newpass123'
        })
        print(f"Registration status: {response.status_code}")
        print(f"Registration data: {response.data}")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username='newuser').exists())
    
    def test_user_login(self):
        """Test user login with email."""
        response = self.client.post('/auth/login/', {
            'email': 'test@example.com',
            'password': 'testpass123'
        })
        
        print(f"\n Login Response Status: {response.status_code}")
        print(f" Login Response Data: {response.data}")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        #  Change from 'access_token' to 'access'
        self.assertIn('access', response.data)  #  FIXED
    
    def test_user_login_invalid_credentials(self):
        """Test login with invalid credentials."""
        response = self.client.post('/auth/login/', {
            'email': 'test@example.com',
            'password': 'wrongpassword'
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_get_user_profile_authenticated(self):
        """Test getting user profile with authentication."""
        # Login to get token
        login_response = self.client.post('/auth/login/', {
            'email': 'test@example.com',
            'password': 'testpass123'
        })
        
        #  Use 'access' instead of 'access_token'
        token = login_response.data.get('access')  #  FIXED
        print(f"Token: {token[:50]}...")  # Print first 50 chars
        
        # Get profile with token
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        response = self.client.get('/api/users/me/')
        
        print(f"Profile status: {response.status_code}")
        print(f"Profile data: {response.data}")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'testuser')
    
    def test_get_user_profile_unauthenticated(self):
        """Test getting user profile without authentication."""
        response = self.client.get('/api/users/me/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)