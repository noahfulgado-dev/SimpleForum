from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from core.models import Topic, Reply, Likes

User = get_user_model()


class TopicAPITest(TestCase):
    """Test Topic API endpoints."""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.topic = Topic.objects.create(
            title='Test Topic',
            description='Test description',
            user=self.user
        )
        # Generate JWT token directly
        refresh = RefreshToken.for_user(self.user)
        self.access_token = str(refresh.access_token)
        self.refresh_token = str(refresh)
        
        print(f"Access Token: {self.access_token[:50]}...")  # Debug
    
    def test_list_topics_public(self):
        """Test listing topics doesn't require authentication."""
        response = self.client.get('/api/topics/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
    
    def test_create_topic_authenticated(self):
        """Test creating a topic requires authentication."""
        # Use Bearer token for JWT
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        response = self.client.post('/api/topics/', {
            'title': 'New Topic',
            'description': 'New description'
        })
        print(f"Response status: {response.status_code}")
        print(f"Response data: {response.data}")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], 'New Topic')
        self.assertEqual(response.data['user']['username'], 'testuser')
    
    def test_create_topic_unauthenticated(self):
        """Test unauthenticated users cannot create topics."""
        self.client.credentials()  # Clear any credentials
        response = self.client.post('/api/topics/', {
            'title': 'New Topic',
            'description': 'New description'
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_get_topic_detail(self):
        """Test getting a single topic."""
        response = self.client.get(f'/api/topics/{self.topic.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Test Topic')
    
    def test_update_topic_author(self):
        """Test author can update their topic."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        response = self.client.put(f'/api/topics/{self.topic.id}/', {
            'title': 'Updated Topic',
            'description': 'Updated description'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Updated Topic')
    
    def test_update_topic_non_author(self):
        """Test non-author cannot update topic."""
        other_user = User.objects.create_user(
            username='otheruser',
            password='otherpass123'
        )
        # Generate JWT for other user
        refresh = RefreshToken.for_user(other_user)
        other_token = str(refresh.access_token)
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {other_token}')
        response = self.client.put(f'/api/topics/{self.topic.id}/', {
            'title': 'Hacked Topic',
            'description': 'Hacked description'
        })
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_delete_topic_author(self):
        """Test author can delete their topic."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        response = self.client.delete(f'/api/topics/{self.topic.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Topic.objects.filter(id=self.topic.id).exists())


class ReplyAPITest(TestCase):
    """Test Reply API endpoints."""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.topic = Topic.objects.create(
            title='Test Topic',
            description='Test description',
            user=self.user
        )
        self.reply = Reply.objects.create(
            topic=self.topic,
            user=self.user,
            content='Test reply'
        )
        # Generate JWT token
        refresh = RefreshToken.for_user(self.user)
        self.access_token = str(refresh.access_token)
    
    def test_create_reply_authenticated(self):
        """Test authenticated user can create a reply."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        response = self.client.post(f'/api/topics/{self.topic.id}/replies/', {
            'content': 'New reply content'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['content'], 'New reply content')
        self.assertEqual(response.data['user']['username'], 'testuser')
    
    def test_create_reply_unauthenticated(self):
        """Test unauthenticated user cannot create a reply."""
        self.client.credentials()  # Clear credentials
        response = self.client.post(f'/api/topics/{self.topic.id}/replies/', {
            'content': 'New reply content'
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_delete_reply_author(self):
        """Test author can delete their reply."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        response = self.client.delete(f'/api/replies/{self.reply.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Reply.objects.filter(id=self.reply.id).exists())


class LikeAPITest(TestCase):
    """Test Like API endpoints."""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.other_user = User.objects.create_user(
            username='otheruser',
            password='otherpass123'
        )
        self.topic = Topic.objects.create(
            title='Test Topic',
            description='Test description',
            user=self.other_user  # Other user owns the topic
        )
        # Generate JWT token
        refresh = RefreshToken.for_user(self.user)
        self.access_token = str(refresh.access_token)
    
    def test_like_topic(self):
        """Test liking a topic."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        response = self.client.post(f'/api/topics/{self.topic.id}/like/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get('status'), 'liked')
        self.assertEqual(response.data.get('like_count'), 1)
    
    def test_unlike_topic(self):
        """Test unliking a topic."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        # Like first
        self.client.post(f'/api/topics/{self.topic.id}/like/')
        # Unlike (toggle)
        response = self.client.post(f'/api/topics/{self.topic.id}/like/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get('status'), 'unliked')
        self.assertEqual(response.data.get('like_count'), 0)
    
    def test_cannot_like_own_topic(self):
        """Test users cannot like their own topic."""
        # Create a topic owned by testuser
        own_topic = Topic.objects.create(
            title='My Topic',
            description='My description',
            user=self.user
        )
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        response = self.client.post(f'/api/topics/{own_topic.id}/like/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data.get('error'), 'You cannot like your own topic.')