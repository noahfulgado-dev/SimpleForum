from django.contrib.auth import get_user_model
from django.test import TestCase
from django.db.models import Count
from forum.models import Topic, Reply
from forum.serializers import TopicSerializer, ReplySerializer

User = get_user_model()


class TopicSerializerTest(TestCase):
    """Test TopicSerializer."""

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='pass123')
        self.topic = Topic.objects.create(
            title='Test Topic',
            description='Test description',
            user=self.user
        )
        self.topic = Topic.objects.annotate(like_count=Count('likes')).get(pk=self.topic.pk)

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
        self.assertIn('reply_count', data)
        self.assertIn('like_count', data)
        self.assertIn('user_has_liked', data)
        self.assertIn('shared_count', data)
        self.assertIn('user_has_shared', data)

    def test_topic_serializer_user_field(self):
        """Test TopicSerializer includes user data."""
        serializer = TopicSerializer(self.topic)
        data = serializer.data

        self.assertEqual(data['user']['id'], self.user.id)
        self.assertEqual(data['user']['username'], self.user.username)

    def test_user_has_liked_false_without_request(self):
        """Test user_has_liked defaults to False when no request in context."""
        serializer = TopicSerializer(self.topic)
        data = serializer.data
        self.assertFalse(data['user_has_liked'])

    def test_shared_count_defaults_to_zero(self):
        """Test shared_count defaults to 0 when no shares exist."""
        serializer = TopicSerializer(self.topic)
        data = serializer.data
        self.assertEqual(data['shared_count'], 0)

    def test_user_has_shared_false_without_request(self):
        """Test user_has_shared defaults to False when no request in context."""
        serializer = TopicSerializer(self.topic)
        data = serializer.data
        self.assertFalse(data['user_has_shared'])


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
        self.assertIn('parent', data)
        self.assertIn('children', data)
        self.assertIn('user', data)
        self.assertIn('content', data)
        self.assertIn('created', data)
        self.assertIn('like_count', data)
        self.assertIn('user_has_liked', data)
        self.assertIn('shared_count', data)
        self.assertIn('user_has_shared', data)

    def test_reply_user_has_liked_false_without_request(self):
        """Test reply user_has_liked defaults to False when no request."""
        serializer = ReplySerializer(self.reply)
        data = serializer.data
        self.assertFalse(data['user_has_liked'])

    def test_reply_shared_count_defaults_to_zero(self):
        """Test reply shared_count defaults to 0 when no shares exist."""
        serializer = ReplySerializer(self.reply)
        data = serializer.data
        self.assertEqual(data['shared_count'], 0)

    def test_reply_user_has_shared_false_without_request(self):
        """Test reply user_has_shared defaults to False when no request."""
        serializer = ReplySerializer(self.reply)
        data = serializer.data
        self.assertFalse(data['user_has_shared'])


    def test_reply_parent_is_none_by_default(self):
        """Test reply parent is None for top-level replies."""
        serializer = ReplySerializer(self.reply)
        data = serializer.data
        self.assertIsNone(data['parent'])

    def test_reply_children_is_empty_by_default(self):
        """Test reply children is empty list."""
        serializer = ReplySerializer(self.reply)
        data = serializer.data
        self.assertEqual(data['children'], [])

    def test_reply_children_with_nesting(self):
        """Test reply children are serialized with depth limiting."""
        child = Reply.objects.create(
            topic=self.topic,
            user=self.user,
            content='Child reply',
            parent=self.reply
        )
        serializer = ReplySerializer(self.reply, context={'depth': 1})
        data = serializer.data
        self.assertEqual(len(data['children']), 1)
        self.assertEqual(data['children'][0]['content'], 'Child reply')
        self.assertEqual(data['children'][0]['parent'], self.reply.id)
