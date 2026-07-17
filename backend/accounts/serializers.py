from rest_framework import serializers
from django.contrib.auth.models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username']
        read_only_fields = ['id', 'username', 'email']


class UserDetailSerializer(serializers.ModelSerializer):
    topics = serializers.SerializerMethodField()
    replies = serializers.SerializerMethodField()
    topic_count = serializers.IntegerField(source='topics.count', read_only=True)
    reply_count = serializers.IntegerField(source='replies.count', read_only=True)

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'topics',
            'replies',
            'topic_count',
            'reply_count',
        ]

    def get_topics(self, obj):
        from forum.serializers import TopicSerializer
        topics = obj.topics.all()[:10]
        return TopicSerializer(topics, many=True, context=self.context).data

    def get_replies(self, obj):
        from forum.serializers import ReplySerializer
        replies = obj.replies.all()[:10]
        return ReplySerializer(replies, many=True, context=self.context).data
