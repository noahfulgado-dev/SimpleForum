from django.contrib.auth import get_user_model
from django.test import TestCase
from forum.models import Topic, Reply

User = get_user_model()


class TopicModelTest(TestCase):
    """Test Topic model."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

    def test_create_topic(self):
        """Test creating a topic."""
        topic = Topic.objects.create(
            title='Test Topic',
            description='This is a test topic',
            user=self.user
        )
        self.assertEqual(topic.title, 'Test Topic')
        self.assertEqual(topic.user, self.user)
        self.assertIsNotNone(topic.created)
        self.assertEqual(str(topic), 'Test Topic')

    def test_topic_ordering(self):
        """Test topics are ordered by newest first."""
        topic1 = Topic.objects.create(title='First', description='First topic', user=self.user)
        import time
        time.sleep(0.1)
        topic2 = Topic.objects.create(title='Second', description='Second topic', user=self.user)

        topics = Topic.objects.all()
        self.assertEqual(topics[0], topic2)
        self.assertEqual(topics[1], topic1)


class ReplyModelTest(TestCase):
    """Test Reply model."""

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='pass123')
        self.topic = Topic.objects.create(
            title='Test Topic',
            description='Test description',
            user=self.user
        )

    def test_create_reply(self):
        """Test creating a reply."""
        reply = Reply.objects.create(
            topic=self.topic,
            user=self.user,
            content='This is a test reply'
        )
        self.assertEqual(reply.content, 'This is a test reply')
        self.assertEqual(reply.topic, self.topic)
        self.assertEqual(reply.user, self.user)
        self.assertIsNotNone(reply.created)

        expected = f"Reply by {self.user.username} on {self.topic.title}"
        self.assertEqual(str(reply), expected)

    def test_reply_ordering(self):
        """Test replies are ordered by oldest first."""
        reply1 = Reply.objects.create(topic=self.topic, user=self.user, content='First reply')
        import time
        time.sleep(0.1)
        reply2 = Reply.objects.create(topic=self.topic, user=self.user, content='Second reply')

        replies = Reply.objects.all()
        self.assertEqual(replies[0], reply1)
        self.assertEqual(replies[1], reply2)
