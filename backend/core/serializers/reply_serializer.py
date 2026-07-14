from rest_framework import serializers
from core.models import Reply
from .user_serializer import UserSerializer

class ReplySerializer(serializers.ModelSerializer):
    """Serializer for Reply model with like count."""
    
    user = UserSerializer(read_only=True)
    like_count = serializers.IntegerField(source='likes.count', read_only=True)
    user_has_liked = serializers.SerializerMethodField()
    
    class Meta:
        model = Reply
        fields = [
            'id', 
            'topic', 
            'user', 
            'content', 
            'created', 
            'like_count',
            'user_has_liked'
        ]
        read_only_fields = ['id', 'created', 'user', 'topic']
    
    def get_user_has_liked(self, obj):
        """Check if the current user has liked this reply."""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False
    
    def create(self, validated_data):
        """Create a new reply with the current user and topic from URL."""
        request = self.context.get('request')
        topic_id = self.context.get('topic_id')
        
        if topic_id:
            from core.models import Topic
            topic = Topic.objects.get(id=topic_id)
            validated_data['topic'] = topic
        
        validated_data['user'] = request.user
        return super().create(validated_data)