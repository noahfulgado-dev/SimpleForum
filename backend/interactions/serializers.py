from rest_framework import serializers
from interactions.models import Likes, Bookmark
from accounts.serializers import UserSerializer
from forum.serializers import TopicSerializer, ReplySerializer
from forum.models import Topic, Reply


class LikeSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Likes
        fields = ['id', 'user', 'topic', 'reply', 'created']
        read_only_fields = ['id', 'user', 'created']


class BookmarkSerializer(serializers.ModelSerializer):
    content_type = serializers.SerializerMethodField()
    content = serializers.SerializerMethodField()

    class Meta:
        model = Bookmark
        fields = ['id', 'content_type', 'content', 'created']
        read_only_fields = ['id', 'created']

    def get_content_type(self, obj):
        return obj.content_type.model

    def get_content(self, obj):
        if isinstance(obj.content_object, Topic):
            return TopicSerializer(obj.content_object, context=self.context).data
        if isinstance(obj.content_object, Reply):
            return ReplySerializer(obj.content_object, context=self.context).data
        return None
