from django.test import TestCase
from django.contrib.auth.models import User
from django.db import IntegrityError
from django.core.exceptions import ValidationError
from core.models import Topic, Reply, Likes


class TopicModelTest(TestCase):
    """Test Topic model."""
    
    def setUp(self):
        """Set up test data."""
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
        time.sleep(0.1)  # Wait a bit so timestamps differ
        topic2 = Topic.objects.create(title='Second', description='Second topic', user=self.user)
        
        topics = Topic.objects.all()
        self.assertEqual(topics[0], topic2)  # Newest first
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
        
        # Test string representation
        expected = f"Reply by {self.user.username} on {self.topic.title}"
        self.assertEqual(str(reply), expected)
    
    def test_reply_ordering(self):
        """Test replies are ordered by oldest first."""
        reply1 = Reply.objects.create(topic=self.topic, user=self.user, content='First reply')
        import time
        time.sleep(0.1)
        reply2 = Reply.objects.create(topic=self.topic, user=self.user, content='Second reply')
        
        replies = Reply.objects.all()
        self.assertEqual(replies[0], reply1)  # Oldest first
        self.assertEqual(replies[1], reply2)


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
        
        with self.assertRaises(IntegrityError):
            Likes.objects.create(user=self.user2, topic=self.topic)
    
    def test_cannot_like_same_reply_twice(self):
        """Test duplicate reply like is prevented."""
        Likes.objects.create(user=self.user2, reply=self.reply)
        
        with self.assertRaises(IntegrityError):
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