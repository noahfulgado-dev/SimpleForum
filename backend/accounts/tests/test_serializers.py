from django.test import TestCase
from django.contrib.auth.models import User
from accounts.serializers import UserSerializer


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
