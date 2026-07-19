from rest_framework import serializers
from forum.models import Topic, Reply
from accounts.serializers import UserSerializer


class TopicSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    replies = serializers.SerializerMethodField()
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
            'user_has_liked',
        ]
        read_only_fields = ['id', 'created', 'user']

    def get_replies(self, obj):
        replies = obj.replies.select_related('user').prefetch_related('likes').all()
        return ReplySerializer(replies, many=True, context=self.context).data

    def get_user_has_liked(self, obj):
        if hasattr(obj, 'user_has_liked'):
            return obj.user_has_liked
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False

    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['user'] = request.user
        return super().create(validated_data)


class ReplySerializer(serializers.ModelSerializer):
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
            'user_has_liked',
        ]
        read_only_fields = ['id', 'created', 'user', 'topic']

    def get_user_has_liked(self, obj):
        if hasattr(obj, 'user_has_liked'):
            return obj.user_has_liked
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False

    def create(self, validated_data):
        request = self.context.get('request')
        topic_id = self.context.get('topic_id')
        if topic_id:
            topic = Topic.objects.get(id=topic_id)
            validated_data['topic'] = topic
        validated_data['user'] = request.user
        return super().create(validated_data)
