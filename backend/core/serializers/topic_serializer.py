from rest_framework import serializers
from core.models import Topic
from .user_serializer import UserSerializer
from .reply_serializer import ReplySerializer

class TopicSerializer(serializers.ModelSerializer):
    """Serializer for Topic model with nested replies and like count."""
    
    user = UserSerializer(read_only=True)
    replies = ReplySerializer(many=True, read_only=True)
    like_count = serializers.IntegerField(read_only=True)
    user_has_liked = serializers.SerializerMethodField()
    
    class Meta:
        model = Topic
        fields = [
            'id', 
            'title', 
            'description', 
            'user', 
            'created', 
            'replies', 
            'like_count',
            'user_has_liked'
        ]
        read_only_fields = ['id', 'created', 'user']
    
    def get_user_has_liked(self, obj):
        """Check if the current user has liked this topic using prefetched data."""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return any(like.user_id == request.user.id for like in obj.likes.all())
        return False
    
    def create(self, validated_data):
        """Create a new topic with the current user."""
        request = self.context.get('request')
        validated_data['user'] = request.user
        return super().create(validated_data)