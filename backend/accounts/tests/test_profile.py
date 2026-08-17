from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.core.cache import cache
from django.db import connection
from django.test import TestCase
from django.test.utils import CaptureQueriesContext
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import Follow
from forum.models import Reply, Topic
from interactions.models import Bookmark, Likes, Share

User = get_user_model()


class ProfileQueryCountTest(TestCase):
    """Profile endpoint must stay query-bounded (no N+1)."""

    def setUp(self):
        cache.clear()
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='owner',
            email='owner@example.com',
            password='testpass123',
        )
        self.other = User.objects.create_user(
            username='other',
            email='other@example.com',
            password='testpass123',
        )
        topic_ct = ContentType.objects.get_for_model(Topic)
        reply_ct = ContentType.objects.get_for_model(Reply)
        for i in range(3):
            topic = Topic.objects.create(
                title=f'Topic {i}',
                description=f'Description {i}',
                user=self.other,
            )
            reply = Reply.objects.create(topic=topic, user=self.other, content=f'reply {i}')
            Likes.objects.create(user=self.other, topic=topic)
            Likes.objects.create(user=self.user, reply=reply)
            Bookmark.objects.create(user=self.other, content_type=topic_ct, object_id=topic.id)
            Share.objects.create(user=self.other, content_type=topic_ct, object_id=topic.id)
        Follow.objects.create(follower=self.user, following=self.other)
        self.token = str(RefreshToken.for_user(self.user).access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

    def test_profile_detail_bounded_queries(self):
        with CaptureQueriesContext(connection) as ctx:
            response = self.client.get(f'/api/users/{self.other.id}/')
        self.assertEqual(response.status_code, 200)
        self.assertLessEqual(len(ctx.captured_queries), 20)
        self.assertEqual(len(response.data['topics']), 3)
        self.assertEqual(len(response.data['replies']), 3)
        self.assertEqual(response.data['is_following'], True)

    def test_own_profile_bounded_queries(self):
        with CaptureQueriesContext(connection) as ctx:
            response = self.client.get('/api/users/me/')
        self.assertEqual(response.status_code, 200)
        self.assertLessEqual(len(ctx.captured_queries), 20)
        self.assertEqual(response.data['username'], 'owner')