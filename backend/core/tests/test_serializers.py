from django.test import TestCase
from django.contrib.auth.models import User
from core.models import Topic, Reply, Likes
from core.serializers import (
    TopicSerializer,
    ReplySerializer,
    UserSerializer,
    UserDetailSerializer
)


class TopicSerializerTest(TestCase):
    """Test TopicSerializer."""
    
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='pass123')
        self.topic = Topic.objects.create(
            title='Test Topic',
            description='Test description',
            user=self.user
        )
    
    def test_topic_serializer_fields(self):
        """Test TopicSerializer returns expected fields."""
        serializer = TopicSerializer(self.topic)
        data = serializer.data
        
        self.assertIn('id', data)
        self.assertIn('title', data)
        self.assertIn('description', data)
        self.assertIn('user', data)
        self.assertIn('created', data)
        self.assertIn('replies', data)
        self.assertIn('like_count', data)
        self.assertIn('user_has_liked', data)
    
    def test_topic_serializer_user_field(self):
        """Test TopicSerializer includes user data."""
        serializer = TopicSerializer(self.topic)
        data = serializer.data
        
        self.assertEqual(data['user']['id'], self.user.id)
        self.assertEqual(data['user']['username'], self.user.username)


class ReplySerializerTest(TestCase):
    """Test ReplySerializer."""
    
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='pass123')
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
    
    def test_reply_serializer_fields(self):
        """Test ReplySerializer returns expected fields."""
        serializer = ReplySerializer(self.reply)
        data = serializer.data
        
        self.assertIn('id', data)
        self.assertIn('topic', data)
        self.assertIn('user', data)
        self.assertIn('content', data)
        self.assertIn('created', data)
        self.assertIn('like_count', data)
        self.assertIn('user_has_liked', data)


class UserSerializerTest(TestCase):
    """Test UserSerializer."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            first_name='Test',
            last_name='User',
            password='pass123'
        )
    
    def test_user_serializer_fields(self):
        """Test UserSerializer returns expected fields."""
        serializer = UserSerializer(self.user)
        data = serializer.data
        
        self.assertEqual(data['id'], self.user.id)
        self.assertEqual(data['username'], 'testuser')
        self.assertEqual(data['email'], 'test@example.com')
        self.assertEqual(data['first_name'], 'Test')
        self.assertEqual(data['last_name'], 'User')