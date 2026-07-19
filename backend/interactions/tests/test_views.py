from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from forum.models import Topic, Reply

User = get_user_model()


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
            user=self.other_user
        )
        self.reply = Reply.objects.create(
            topic=self.topic,
            user=self.other_user,
            content='Test reply'
        )
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
        self.client.post(f'/api/topics/{self.topic.id}/like/')
        response = self.client.post(f'/api/topics/{self.topic.id}/like/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get('status'), 'unliked')
        self.assertEqual(response.data.get('like_count'), 0)

    def test_cannot_like_own_topic(self):
        """Test users cannot like their own topic."""
        own_topic = Topic.objects.create(
            title='My Topic',
            description='My description',
            user=self.user
        )
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        response = self.client.post(f'/api/topics/{own_topic.id}/like/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data.get('error'), 'You cannot like your own topic.')

    def test_like_reply(self):
        """Test liking a reply."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        response = self.client.post(f'/api/replies/{self.reply.id}/like/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get('status'), 'liked')

    def test_unlike_reply(self):
        """Test unliking a reply."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        self.client.post(f'/api/replies/{self.reply.id}/like/')
        response = self.client.post(f'/api/replies/{self.reply.id}/like/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get('status'), 'unliked')

    def test_cannot_like_own_reply(self):
        """Test users cannot like their own reply."""
        own_reply = Reply.objects.create(
            topic=self.topic,
            user=self.user,
            content='My reply'
        )
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        response = self.client.post(f'/api/replies/{own_reply.id}/like/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data.get('error'), 'You cannot like your own reply.')

    def test_like_nonexistent_topic(self):
        """Test liking a non-existent topic returns 404."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        response = self.client.post('/api/topics/99999/like/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
