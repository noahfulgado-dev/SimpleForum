from django.contrib.auth import get_user_model
from django.test import TestCase
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.contrib.contenttypes.models import ContentType
from forum.models import Topic, Reply
from interactions.models import Likes, Bookmark

User = get_user_model()


class LikesModelTest(TestCase):
    """Test Likes model."""

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='pass123')
        self.user2 = User.objects.create_user(username='testuser2', password='pass123')
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

    def test_like_topic(self):
        """Test liking a topic."""
        like = Likes.objects.create(user=self.user2, topic=self.topic)
        self.assertEqual(like.topic, self.topic)
        self.assertEqual(like.user, self.user2)
        self.assertIsNone(like.reply)
        self.assertEqual(str(like), f"{self.user2.username} likes Topic: {self.topic.title}")

    def test_like_reply(self):
        """Test liking a reply."""
        like = Likes.objects.create(user=self.user2, reply=self.reply)
        self.assertEqual(like.reply, self.reply)
        self.assertEqual(like.user, self.user2)
        self.assertIsNone(like.topic)
        self.assertEqual(str(like), f"{self.user2.username} likes Reply #{self.reply.id}")

    def test_cannot_like_same_topic_twice(self):
        """Test duplicate topic like is prevented."""
        Likes.objects.create(user=self.user2, topic=self.topic)

        with self.assertRaises(ValidationError):
            Likes.objects.create(user=self.user2, topic=self.topic)

    def test_cannot_like_same_reply_twice(self):
        """Test duplicate reply like is prevented."""
        Likes.objects.create(user=self.user2, reply=self.reply)

        with self.assertRaises(ValidationError):
            Likes.objects.create(user=self.user2, reply=self.reply)

    def test_like_validation_topic_and_reply(self):
        """Test that a like cannot have both topic and reply."""
        like = Likes(user=self.user2, topic=self.topic, reply=self.reply)
        with self.assertRaises(ValidationError):
            like.full_clean()

    def test_like_validation_neither_topic_nor_reply(self):
        """Test that a like must have either topic or reply."""
        like = Likes(user=self.user2)
        with self.assertRaises(ValidationError):
            like.full_clean()


class BookmarkModelTest(TestCase):
    """Test Bookmark model."""

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='pass123')
        self.user2 = User.objects.create_user(username='testuser2', password='pass123')
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
        self.topic_type = ContentType.objects.get_for_model(Topic)
        self.reply_type = ContentType.objects.get_for_model(Reply)

    def test_bookmark_topic(self):
        """Test bookmarking a topic."""
        bookmark = Bookmark.objects.create(
            user=self.user2,
            content_type=self.topic_type,
            object_id=self.topic.id
        )
        self.assertEqual(bookmark.content_object, self.topic)
        self.assertEqual(bookmark.user, self.user2)
        self.assertEqual(bookmark.content_type, self.topic_type)
        self.assertEqual(
            str(bookmark),
            f"{self.user2.username} bookmarked topic #{self.topic.id}"
        )

    def test_bookmark_reply(self):
        """Test bookmarking a reply."""
        bookmark = Bookmark.objects.create(
            user=self.user2,
            content_type=self.reply_type,
            object_id=self.reply.id
        )
        self.assertEqual(bookmark.content_object, self.reply)
        self.assertEqual(bookmark.user, self.user2)
        self.assertEqual(bookmark.content_type, self.reply_type)
        self.assertEqual(
            str(bookmark),
            f"{self.user2.username} bookmarked reply #{self.reply.id}"
        )

    def test_cannot_bookmark_same_topic_twice(self):
        """Test duplicate topic bookmark is prevented."""
        Bookmark.objects.create(
            user=self.user2,
            content_type=self.topic_type,
            object_id=self.topic.id
        )
        with self.assertRaises(IntegrityError):
            Bookmark.objects.create(
                user=self.user2,
                content_type=self.topic_type,
                object_id=self.topic.id
            )

    def test_cannot_bookmark_same_reply_twice(self):
        """Test duplicate reply bookmark is prevented."""
        Bookmark.objects.create(
            user=self.user2,
            content_type=self.reply_type,
            object_id=self.reply.id
        )
        with self.assertRaises(IntegrityError):
            Bookmark.objects.create(
                user=self.user2,
                content_type=self.reply_type,
                object_id=self.reply.id
            )

    def test_different_users_can_bookmark_same_topic(self):
        """Test different users can bookmark the same topic."""
        Bookmark.objects.create(
            user=self.user,
            content_type=self.topic_type,
            object_id=self.topic.id
        )
        Bookmark.objects.create(
            user=self.user2,
            content_type=self.topic_type,
            object_id=self.topic.id
        )
        self.assertEqual(Bookmark.objects.filter(content_type=self.topic_type, object_id=self.topic.id).count(), 2)
