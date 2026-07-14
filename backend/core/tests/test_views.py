from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from core.models import Topic, Reply, Likes


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
        self.token = self.get_token()
    
    def get_token(self):
        """Get JWT token for testing."""
        response = self.client.post('/auth/login/', {
            'username': 'testuser',
            'password': 'testpass123'
        })
        return response.data.get('access_token')
    
    def test_list_topics_public(self):
        """Test listing topics doesn't require authentication."""
        response = self.client.get('/api/topics/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)  # If paginated
    
    def test_create_topic_authenticated(self):
        """Test creating a topic requires authentication."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')
        response = self.client.post('/api/topics/', {
            'title': 'New Topic',
            'description': 'New description'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], 'New Topic')
        self.assertEqual(response.data['user']['username'], 'testuser')
    
    def test_create_topic_unauthenticated(self):
        """Test unauthenticated users cannot create topics."""
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
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')
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
        response = self.client.post('/auth/login/', {
            'username': 'otheruser',
            'password': 'otherpass123'
        })
        token = response.data.get('access_token')
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        response = self.client.put(f'/api/topics/{self.topic.id}/', {
            'title': 'Hacked Topic',
            'description': 'Hacked description'
        })
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_delete_topic_author(self):
        """Test author can delete their topic."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')
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
        self.token = self.get_token()
    
    def get_token(self):
        response = self.client.post('/auth/login/', {
            'username': 'testuser',
            'password': 'testpass123'
        })
        return response.data.get('access_token')
    
    def test_create_reply_authenticated(self):
        """Test authenticated user can create a reply."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')
        response = self.client.post(f'/api/topics/{self.topic.id}/replies/', {
            'content': 'New reply content'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['content'], 'New reply content')
        self.assertEqual(response.data['user']['username'], 'testuser')
    
    def test_create_reply_unauthenticated(self):
        """Test unauthenticated user cannot create a reply."""
        response = self.client.post(f'/api/topics/{self.topic.id}/replies/', {
            'content': 'New reply content'
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_delete_reply_author(self):
        """Test author can delete their reply."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')
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
        self.token = self.get_token()
    
    def get_token(self):
        response = self.client.post('/auth/login/', {
            'username': 'testuser',
            'password': 'testpass123'
        })
        return response.data.get('access_token')
    
    def test_like_topic(self):
        """Test liking a topic."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')
        response = self.client.post(f'/api/topics/{self.topic.id}/like/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'liked')
        self.assertEqual(response.data['like_count'], 1)
    
    def test_unlike_topic(self):
        """Test unliking a topic."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')
        # Like first
        self.client.post(f'/api/topics/{self.topic.id}/like/')
        # Unlike
        response = self.client.post(f'/api/topics/{self.topic.id}/like/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'unliked')
        self.assertEqual(response.data['like_count'], 0)
    
    def test_cannot_like_own_topic(self):
        """Test users cannot like their own topic."""
        # Create a topic owned by testuser
        own_topic = Topic.objects.create(
            title='My Topic',
            description='My description',
            user=self.user
        )
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')
        response = self.client.post(f'/api/topics/{own_topic.id}/like/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error'], 'You cannot like your own topic.')