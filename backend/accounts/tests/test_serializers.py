from django.contrib.auth import get_user_model
from django.test import TestCase
from accounts.serializers import UserSerializer, UserDetailSerializer

User = get_user_model()


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


class UserDetailSerializerTest(TestCase):
    """Test UserDetailSerializer."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='pass123'
        )
        self.user.bio = 'My bio'
        self.user.avatar = 'https://example.com/avatar.jpg'
        self.user.save()

    def test_detail_serializer_includes_profile_fields(self):
        """Test UserDetailSerializer returns profile fields."""
        serializer = UserDetailSerializer(self.user)
        data = serializer.data

        self.assertEqual(data['id'], self.user.id)
        self.assertEqual(data['username'], 'testuser')
        self.assertEqual(data['bio'], 'My bio')
        self.assertEqual(data['avatar'], 'https://example.com/avatar.jpg')
        self.assertIn('topics', data)
        self.assertIn('replies', data)
        self.assertIn('topic_count', data)
        self.assertIn('reply_count', data)
