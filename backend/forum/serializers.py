import bleach
from rest_framework import serializers
from forum.models import Topic, Reply
from accounts.serializers import UserSerializer


class TopicSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    replies = serializers.SerializerMethodField()
    reply_count = serializers.IntegerField(source='replies.count', read_only=True)
    like_count = serializers.IntegerField(read_only=True)
    user_has_liked = serializers.SerializerMethodField()
    user_has_bookmarked = serializers.SerializerMethodField()
    shared_count = serializers.SerializerMethodField()
    user_has_shared = serializers.SerializerMethodField()

    class Meta:
        model = Topic
        fields = [
            'id',
            'title',
            'description',
            'user',
            'created',
            'replies',
            'reply_count',
            'like_count',
            'user_has_liked',
            'user_has_bookmarked',
            'shared_count',
            'user_has_shared',
        ]
        read_only_fields = ['id', 'created', 'user']

    def get_replies(self, obj):
        replies = obj.replies.filter(parent__isnull=True).select_related('user').prefetch_related('likes').all()
        return ReplySerializer(replies, many=True, context={**self.context, 'depth': 1}).data

    def get_user_has_liked(self, obj):
        if hasattr(obj, 'user_has_liked'):
            return obj.user_has_liked
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False

    def get_user_has_bookmarked(self, obj):
        if hasattr(obj, 'user_has_bookmarked'):
            return obj.user_has_bookmarked
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            from django.contrib.contenttypes.models import ContentType
            from interactions.models import Bookmark
            topic_type = ContentType.objects.get_for_model(Topic)
            return Bookmark.objects.filter(user=request.user, content_type=topic_type, object_id=obj.id).exists()
        return False

    def get_shared_count(self, obj):
        from django.contrib.contenttypes.models import ContentType
        from interactions.models import Share
        topic_type = ContentType.objects.get_for_model(Topic)
        return Share.objects.filter(content_type=topic_type, object_id=obj.id).count()

    def get_user_has_shared(self, obj):
        if hasattr(obj, 'user_has_shared'):
            return obj.user_has_shared
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            from django.contrib.contenttypes.models import ContentType
            from interactions.models import Share
            topic_type = ContentType.objects.get_for_model(Topic)
            return Share.objects.filter(user=request.user, content_type=topic_type, object_id=obj.id).exists()
        return False

    def validate_title(self, value):
        value = bleach.clean(value, tags=[], strip=True).strip()
        if len(value) < 3:
            raise serializers.ValidationError('Title must be at least 3 characters.')
        return value

    def validate_description(self, value):
        return bleach.clean(value, tags=[], strip=True).strip()

    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['user'] = request.user
        return super().create(validated_data)


class ReplySerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    parent = serializers.PrimaryKeyRelatedField(queryset=Reply.objects.all(), required=False, allow_null=True)
    children = serializers.SerializerMethodField()
    like_count = serializers.IntegerField(source='likes.count', read_only=True)
    user_has_liked = serializers.SerializerMethodField()
    user_has_bookmarked = serializers.SerializerMethodField()
    shared_count = serializers.SerializerMethodField()
    user_has_shared = serializers.SerializerMethodField()

    class Meta:
        model = Reply
        fields = [
            'id',
            'topic',
            'parent',
            'children',
            'user',
            'content',
            'created',
            'like_count',
            'user_has_liked',
            'user_has_bookmarked',
            'shared_count',
            'user_has_shared',
        ]
        read_only_fields = ['id', 'created', 'user', 'topic']

    def get_children(self, obj):
        depth = self.context.get('depth', 0)
        if depth <= 0:
            return []
        children = obj.children.select_related('user').prefetch_related('likes').all()
        return ReplySerializer(children, many=True, context={**self.context, 'depth': depth - 1}).data

    def get_user_has_liked(self, obj):
        if hasattr(obj, 'user_has_liked'):
            return obj.user_has_liked
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False

    def get_user_has_bookmarked(self, obj):
        if hasattr(obj, 'user_has_bookmarked'):
            return obj.user_has_bookmarked
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            from django.contrib.contenttypes.models import ContentType
            from interactions.models import Bookmark
            reply_type = ContentType.objects.get_for_model(Reply)
            return Bookmark.objects.filter(user=request.user, content_type=reply_type, object_id=obj.id).exists()
        return False

    def get_shared_count(self, obj):
        from django.contrib.contenttypes.models import ContentType
        from interactions.models import Share
        reply_type = ContentType.objects.get_for_model(Reply)
        return Share.objects.filter(content_type=reply_type, object_id=obj.id).count()

    def get_user_has_shared(self, obj):
        if hasattr(obj, 'user_has_shared'):
            return obj.user_has_shared
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            from django.contrib.contenttypes.models import ContentType
            from interactions.models import Share
            reply_type = ContentType.objects.get_for_model(Reply)
            return Share.objects.filter(user=request.user, content_type=reply_type, object_id=obj.id).exists()
        return False

    def validate_content(self, value):
        return bleach.clean(value, tags=[], strip=True).strip()

    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['user'] = request.user
        return super().create(validated_data)
