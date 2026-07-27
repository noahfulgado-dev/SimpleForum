from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'avatar']
        read_only_fields = ['id', 'username', 'email', 'avatar']


class UserDetailSerializer(serializers.ModelSerializer):
    topics = serializers.SerializerMethodField()
    replies = serializers.SerializerMethodField()
    shares = serializers.SerializerMethodField()
    topic_count = serializers.IntegerField(source='topics.count', read_only=True)
    reply_count = serializers.IntegerField(source='replies.count', read_only=True)
    share_count = serializers.IntegerField(source='shares.count', read_only=True)
    total_likes = serializers.SerializerMethodField()
    follower_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    is_following = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'bio',
            'avatar',
            'topics',
            'replies',
            'shares',
            'topic_count',
            'reply_count',
            'share_count',
            'total_likes',
            'follower_count',
            'following_count',
            'is_following',
        ]

    def get_topics(self, obj):
        from forum.serializers import TopicSerializer
        from django.db.models import Count
        topics = obj.topics.select_related('user').prefetch_related('likes').annotate(
            like_count=Count('likes')
        )[:10]
        return TopicSerializer(topics, many=True, context=self.context).data

    def get_replies(self, obj):
        from forum.serializers import ReplySerializer
        replies = obj.replies.select_related('user', 'topic').prefetch_related('likes').all()[:10]
        return ReplySerializer(replies, many=True, context=self.context).data

    def get_shares(self, obj):
        from interactions.serializers import ShareSerializer
        shares = obj.shares.select_related('content_type').order_by('-created')[:10]
        return ShareSerializer(shares, many=True, context=self.context).data

    def get_total_likes(self, obj):
        from django.db.models import Count, Subquery, OuterRef, Value
        from django.db.models.functions import Coalesce
        from interactions.models import Likes
        topic_likes_subq = Likes.objects.filter(topic__user=OuterRef('pk')).values('topic__user').annotate(count=Count('*')).values('count')
        reply_likes_subq = Likes.objects.filter(reply__user=OuterRef('pk')).values('reply__user').annotate(count=Count('*')).values('count')
        result = User.objects.filter(pk=obj.pk).annotate(
            total_likes=Coalesce(Subquery(topic_likes_subq), Value(0)) + Coalesce(Subquery(reply_likes_subq), Value(0)),
        ).values('total_likes').first()
        return result['total_likes'] if result else 0

    def get_follower_count(self, obj):
        return obj.followers.count()

    def get_following_count(self, obj):
        return obj.following.count()

    def get_is_following(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.followers.filter(follower=request.user).exists()
        return False
