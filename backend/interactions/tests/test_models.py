from django.test import TestCase
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from forum.models import Topic, Reply
from interactions.models import Likes


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
