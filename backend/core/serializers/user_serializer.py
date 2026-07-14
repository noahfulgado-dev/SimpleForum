from rest_framework import serializers
from django.contrib.auth.models import User

class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model - used for displaying user info."""
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        read_only_fields = ['id', 'username', 'email']

class UserDetailSerializer(serializers.ModelSerializer):
    """Detailed User Serializer with there topics and replies"""

    # Nested data
    topics = serializers.SerializerMethodField()
    replies = serializers.SerializerMethodField()

    # Counts
    topic_count = serializers.IntegerField(source='topic.count', read_only=True)
    reply_count = serializers.IntegerField(source='replies.count', read_only=True)

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'topics',
            'replies',
            'topic_count',
            'reply_count',
        ]
    
    def get_topics(self, obj):
        """Get all topics by this user with limited fields"""
        from core.serializers.topic_serializer import TopicSerializer
        topics = obj.topics.all()[:10]
        return TopicSerializer(topics, many=True, context=self.context).data
    
    def get_replies(self, obj):
        """Get all replies by this user with limited fields"""
        from core.serializers.reply_serializer import ReplySerializer
        replies = obj.topics.all()[:10]
        return ReplySerializer(replies, many=True, context=self.context).data
    