from rest_framework import serializers
from core.models import Likes
from .user_serializer import UserSerializer

class LikeSerializer(serializers.ModelSerializer):
    """Serializer for Likes model."""
    
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Likes
        fields = ['id', 'user', 'topic', 'reply', 'created']
        read_only_fields = ['id', 'user', 'created']