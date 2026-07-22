from datetime import timedelta

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db import IntegrityError
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from forum.models import Topic, Reply
from interactions.models import Likes
from .models import Notification

User = get_user_model()


class NotificationModelTest(TestCase):
    """Test Notification model."""

    def setUp(self):
        self.user = User.objects.create_user(username='user', password='pass')
        self.actor = User.objects.create_user(username='actor', password='pass')
        self.topic = Topic.objects.create(
            title='Test Topic', description='Desc', user=self.user
        )
        self.notification = Notification.objects.create(
            recipient=self.user,
            actor=self.actor,
            verb=Notification.VerbType.REPLIED,
            target=self.topic,
        )

    def test_create_notification(self):
        """Test creating a notification with all required fields."""
        self.assertEqual(self.notification.recipient, self.user)
        self.assertEqual(self.notification.actor, self.actor)
        self.assertEqual(self.notification.verb, 'replied')
        self.assertEqual(self.notification.target, self.topic)
        self.assertEqual(self.notification.count, 1)
        self.assertFalse(self.notification.is_read)
        self.assertIsNotNone(self.notification.created)

    def test_notification_default_count(self):
        """Test notification count defaults to 1."""
        self.assertEqual(self.notification.count, 1)

    def test_notification_default_is_read(self):
        """Test notification is_read defaults to False."""
        self.assertFalse(self.notification.is_read)

    def test_notification_ordering(self):
        """Test notifications are ordered by newest first."""
        newer = Notification.objects.create(
            recipient=self.user, actor=self.actor,
            verb=Notification.VerbType.LIKED, target=self.topic,
        )
        qs = Notification.objects.all()
        self.assertEqual(qs.first(), newer)

    def test_unique_constraint_prevents_duplicate_unread(self):
        """Test duplicate unread notification raises IntegrityError."""
        with self.assertRaises(IntegrityError):
            Notification.objects.create(
                recipient=self.user,
                actor=self.actor,
                verb=Notification.VerbType.REPLIED,
                target=self.topic,
            )

    def test_unique_constraint_allows_read_duplicate(self):
        """Test a read notification doesn't block a new unread one."""
        self.notification.is_read = True
        self.notification.save()
        second = Notification.objects.create(
            recipient=self.user, actor=self.actor,
            verb=Notification.VerbType.REPLIED, target=self.topic,
        )
        self.assertEqual(Notification.objects.count(), 2)


class NotificationSignalTest(TestCase):
    """Test signals create notifications on Reply and Like creation."""

    def setUp(self):
        self.topic_author = User.objects.create_user(
            username='author', password='pass'
        )
        self.actor = User.objects.create_user(
            username='actor', password='pass'
        )
        self.topic = Topic.objects.create(
            title='Topic', description='Desc', user=self.topic_author
        )

    def test_reply_creates_notification(self):
        """Test creating a reply creates a notification for the topic author."""
        reply = Reply.objects.create(
            topic=self.topic, user=self.actor, content='A reply'
        )
        notif = Notification.objects.filter(
            recipient=self.topic_author, verb=Notification.VerbType.REPLIED
        ).first()
        self.assertIsNotNone(notif)
        self.assertEqual(notif.actor, self.actor)
        self.assertEqual(notif.target, self.topic)
        self.assertEqual(notif.count, 1)

    def test_like_on_topic_creates_notification(self):
        """Test liking a topic creates a notification for the topic author."""
        like = Likes.objects.create(user=self.actor, topic=self.topic)
        notif = Notification.objects.filter(
            recipient=self.topic_author, verb=Notification.VerbType.LIKED
        ).first()
        self.assertIsNotNone(notif)
        self.assertEqual(notif.actor, self.actor)
        self.assertEqual(notif.target, self.topic)
        self.assertEqual(notif.count, 1)

    def test_like_on_reply_creates_notification(self):
        """Test liking a reply creates a notification for the reply author."""
        reply_author = User.objects.create_user(
            username='replyauthor', password='pass'
        )
        reply = Reply.objects.create(
            topic=self.topic, user=reply_author, content='A reply'
        )
        like = Likes.objects.create(user=self.actor, reply=reply)
        notif = Notification.objects.filter(
            recipient=reply_author, verb=Notification.VerbType.LIKED
        ).first()
        self.assertIsNotNone(notif)
        self.assertEqual(notif.actor, self.actor)
        self.assertEqual(notif.target, reply)
        self.assertEqual(notif.count, 1)

    def test_no_self_notification_on_reply(self):
        """Test replying to own topic does not create a notification."""
        Reply.objects.create(
            topic=self.topic, user=self.topic_author, content='Self reply'
        )
        notif = Notification.objects.filter(recipient=self.topic_author)
        self.assertEqual(notif.count(), 0)

    def test_no_self_notification_on_like(self):
        """Test liking own topic does not create a notification."""
        Likes.objects.create(user=self.topic_author, topic=self.topic)
        notif = Notification.objects.filter(recipient=self.topic_author)
        self.assertEqual(notif.count(), 0)

    def test_like_unlike_does_not_delete_notification(self):
        """Test unliking does not remove the notification."""
        Likes.objects.create(user=self.actor, topic=self.topic)
        Likes.objects.filter(user=self.actor, topic=self.topic).delete()
        notif = Notification.objects.filter(
            recipient=self.topic_author, verb=Notification.VerbType.LIKED
        )
        self.assertEqual(notif.count(), 1)


class NotificationCooldownTest(TestCase):
    """Test notification rate limiting / cooldown behavior."""

    def setUp(self):
        self.author = User.objects.create_user(username='author', password='pass')
        self.actor1 = User.objects.create_user(username='actor1', password='pass')
        self.actor2 = User.objects.create_user(username='actor2', password='pass')
        self.topic = Topic.objects.create(
            title='Topic', description='Desc', user=self.author
        )

    def test_multiple_likes_within_cooldown_increment_count(self):
        """Test multiple likes within 30 minutes merge into one notification."""
        Likes.objects.create(user=self.actor1, topic=self.topic)
        Likes.objects.create(user=self.actor2, topic=self.topic)
        notifs = Notification.objects.filter(
            recipient=self.author, verb=Notification.VerbType.LIKED
        )
        self.assertEqual(notifs.count(), 1)
        self.assertEqual(notifs.first().count, 2)

    def test_multiple_replies_within_cooldown_increment_count(self):
        """Test multiple replies within 30 minutes merge into one notification."""
        Reply.objects.create(topic=self.topic, user=self.actor1, content='Reply 1')
        Reply.objects.create(topic=self.topic, user=self.actor2, content='Reply 2')
        notifs = Notification.objects.filter(
            recipient=self.author, verb=Notification.VerbType.REPLIED
        )
        self.assertEqual(notifs.count(), 1)
        self.assertEqual(notifs.first().count, 2)

    def test_like_after_cooldown_reuses_slot(self):
        """Test a like after the cooldown window reuses the notification slot."""
        Likes.objects.create(user=self.actor1, topic=self.topic)

        notif = Notification.objects.filter(
            recipient=self.author, verb=Notification.VerbType.LIKED
        ).first()
        notif.created = timezone.now() - timedelta(minutes=31)
        notif.count = 2
        notif.save(update_fields=['created', 'count'])

        Likes.objects.create(user=self.actor2, topic=self.topic)
        notif.refresh_from_db()
        self.assertEqual(notif.count, 1)
        self.assertGreater(notif.created, timezone.now() - timedelta(minutes=1))

    def test_read_notification_does_not_block_new_likes(self):
        """Test a read notification does not merge with new likes."""
        Likes.objects.create(user=self.actor1, topic=self.topic)
        notif = Notification.objects.filter(
            recipient=self.author, verb=Notification.VerbType.LIKED
        ).first()
        notif.is_read = True
        notif.save(update_fields=['is_read'])

        Likes.objects.create(user=self.actor2, topic=self.topic)
        notifs = Notification.objects.filter(
            recipient=self.author, verb=Notification.VerbType.LIKED
        )
        self.assertEqual(notifs.count(), 2)


class NotificationAPITest(TestCase):
    """Test Notification API endpoints."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='user', password='pass')
        self.other = User.objects.create_user(username='other', password='pass')
        refresh = RefreshToken.for_user(self.user)
        self.access_token = str(refresh.access_token)
        self.topic = Topic.objects.create(
            title='Topic', description='Desc', user=self.user
        )

        self.notif1 = Notification.objects.create(
            recipient=self.user, actor=self.other,
            verb=Notification.VerbType.LIKED, target=self.topic,
        )
        self.notif2 = Notification.objects.create(
            recipient=self.user, actor=self.other,
            verb=Notification.VerbType.REPLIED, target=self.topic,
        )
        self.notif2.is_read = True
        self.notif2.save(update_fields=['is_read'])

    def authenticate(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')

    def test_list_notifications_authenticated(self):
        """Test authenticated user can list their notifications."""
        self.authenticate()
        response = self.client.get('/api/notifications/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)

    def test_list_notifications_requires_auth(self):
        """Test unauthenticated request returns 401."""
        response = self.client.get('/api/notifications/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_notifications_only_own(self):
        """Test user only sees their own notifications."""
        Notification.objects.create(
            recipient=self.other, actor=self.user,
            verb=Notification.VerbType.LIKED, target=self.topic,
        )
        self.authenticate()
        response = self.client.get('/api/notifications/')
        self.assertEqual(len(response.data['results']), 2)

    def test_unread_count(self):
        """Test unread count returns correct number."""
        self.authenticate()
        response = self.client.get('/api/notifications/unread-count/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)

    def test_mark_as_read(self):
        """Test marking a single notification as read."""
        self.authenticate()
        response = self.client.patch(f'/api/notifications/{self.notif1.id}/read/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.notif1.refresh_from_db()
        self.assertTrue(self.notif1.is_read)

    def test_mark_as_read_only_own(self):
        """Test user cannot mark another user's notification as read."""
        other_notif = Notification.objects.create(
            recipient=self.other, actor=self.user,
            verb=Notification.VerbType.LIKED, target=self.topic,
        )
        self.authenticate()
        response = self.client.patch(f'/api/notifications/{other_notif.id}/read/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_mark_all_as_read(self):
        """Test marking all notifications as read."""
        self.authenticate()
        response = self.client.patch('/api/notifications/read-all/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['updated'], 1)
        self.assertEqual(
            Notification.objects.filter(recipient=self.user, is_read=False).count(),
            0,
        )

    def test_mark_all_as_read_no_unread(self):
        """Test mark-all when none are unread."""
        Notification.objects.filter(recipient=self.user).update(is_read=True)
        self.authenticate()
        response = self.client.patch('/api/notifications/read-all/')
        self.assertEqual(response.data['updated'], 0)

    def test_unread_count_no_unread(self):
        """Test unread count returns 0 when all read."""
        Notification.objects.filter(recipient=self.user).update(is_read=True)
        self.authenticate()
        response = self.client.get('/api/notifications/unread-count/')
        self.assertEqual(response.data['count'], 0)

    def test_notification_serializer_includes_actor_info(self):
        """Test notification response includes actor_id and actor_username."""
        self.authenticate()
        response = self.client.get('/api/notifications/')
        result = response.data['results'][0]
        self.assertIn('actor_id', result)
        self.assertIn('actor_username', result)
        self.assertEqual(result['actor_id'], self.other.id)
        self.assertEqual(result['actor_username'], self.other.username)
