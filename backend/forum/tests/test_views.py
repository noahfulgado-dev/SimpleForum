from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.contenttypes.models import ContentType
from forum.models import Topic, Reply
from interactions.models import Likes, Bookmark

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
        refresh = RefreshToken.for_user(self.user)
        self.access_token = str(refresh.access_token)

    def test_list_topics_unauthenticated(self):
        """Test listing topics requires authentication."""
        response = self.client.get('/api/topics/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_topic_authenticated(self):
        """Test creating a topic requires authentication."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        response = self.client.post('/api/topics/', {
            'title': 'New Topic',
            'description': 'New description'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], 'New Topic')
        self.assertEqual(response.data['user']['username'], 'testuser')

    def test_create_topic_unauthenticated(self):
        """Test unauthenticated users cannot create topics."""
        self.client.credentials()
        response = self.client.post('/api/topics/', {
            'title': 'New Topic',
            'description': 'New description'
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_topic_detail(self):
        """Test getting a single topic."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
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

    def test_topic_list_includes_user_has_liked(self):
        """Test topic list includes user_has_liked field."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        response = self.client.get('/api/topics/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for topic in response.data['results']:
            self.assertIn('user_has_liked', topic)
            self.assertIsInstance(topic['user_has_liked'], bool)

    def test_topic_detail_user_has_liked_true_when_liked(self):
        """Test user_has_liked is true when current user liked the topic."""
        Likes.objects.create(user=self.user, topic=self.topic)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        response = self.client.get(f'/api/topics/{self.topic.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['user_has_liked'])

    def test_topic_detail_user_has_liked_false_when_not_liked(self):
        """Test user_has_liked is false when current user has not liked."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        response = self.client.get(f'/api/topics/{self.topic.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['user_has_liked'])

    def test_topic_detail_user_has_liked_requires_auth(self):
        """Test anonymous users cannot access topic detail."""
        self.client.credentials()
        response = self.client.get(f'/api/topics/{self.topic.id}/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_topic_list_includes_user_has_bookmarked(self):
        """Test topic list includes user_has_bookmarked field."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        response = self.client.get('/api/topics/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for topic in response.data['results']:
            self.assertIn('user_has_bookmarked', topic)
            self.assertIsInstance(topic['user_has_bookmarked'], bool)

    def test_topic_detail_user_has_bookmarked_true_when_bookmarked(self):
        """Test user_has_bookmarked is true when current user bookmarked the topic."""
        topic_type = ContentType.objects.get_for_model(Topic)
        Bookmark.objects.create(user=self.user, content_type=topic_type, object_id=self.topic.id)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        response = self.client.get(f'/api/topics/{self.topic.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['user_has_bookmarked'])

    def test_topic_detail_user_has_bookmarked_false_when_not_bookmarked(self):
        """Test user_has_bookmarked is false when current user has not bookmarked."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        response = self.client.get(f'/api/topics/{self.topic.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['user_has_bookmarked'])

    def test_topic_detail_user_has_bookmarked_requires_auth(self):
        """Test anonymous users cannot access topic detail."""
        self.client.credentials()
        response = self.client.get(f'/api/topics/{self.topic.id}/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


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
        self.client.credentials()
        response = self.client.post(f'/api/topics/{self.topic.id}/replies/', {
            'content': 'New reply content'
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_reply_authenticated(self):
        """Test authenticated user can view a reply."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        response = self.client.get(f'/api/replies/{self.reply.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['content'], 'Test reply')
        self.assertEqual(response.data['user']['username'], 'testuser')

    def test_update_reply_author(self):
        """Test author can update their reply."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        response = self.client.patch(f'/api/replies/{self.reply.id}/', {
            'content': 'Updated reply content'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['content'], 'Updated reply content')

    def test_update_reply_non_author(self):
        """Test non-author cannot update a reply."""
        other_user = User.objects.create_user(
            username='otheruser',
            password='otherpass123'
        )
        refresh = RefreshToken.for_user(other_user)
        other_token = str(refresh.access_token)

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {other_token}')
        response = self.client.patch(f'/api/replies/{self.reply.id}/', {
            'content': 'Hacked reply content'
        })
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_update_reply_unauthenticated(self):
        """Test unauthenticated user cannot update a reply."""
        self.client.credentials()
        response = self.client.patch(f'/api/replies/{self.reply.id}/', {
            'content': 'Hacked reply content'
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_delete_reply_author(self):
        """Test author can delete their reply."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        response = self.client.delete(f'/api/replies/{self.reply.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Reply.objects.filter(id=self.reply.id).exists())

    def test_reply_detail_user_has_liked(self):
        """Test reply detail includes user_has_liked."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        response = self.client.get(f'/api/replies/{self.reply.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('user_has_liked', response.data)
        self.assertFalse(response.data['user_has_liked'])

    def test_reply_detail_user_has_bookmarked_true_when_bookmarked(self):
        """Test reply detail includes user_has_bookmarked when bookmarked."""
        reply_type = ContentType.objects.get_for_model(Reply)
        Bookmark.objects.create(user=self.user, content_type=reply_type, object_id=self.reply.id)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        response = self.client.get(f'/api/replies/{self.reply.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('user_has_bookmarked', response.data)
        self.assertTrue(response.data['user_has_bookmarked'])

    def test_reply_detail_user_has_bookmarked_false_when_not_bookmarked(self):
        """Test reply detail user_has_bookmarked is false when not bookmarked."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        response = self.client.get(f'/api/replies/{self.reply.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('user_has_bookmarked', response.data)
        self.assertFalse(response.data['user_has_bookmarked'])
