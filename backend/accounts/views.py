from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.db.models import Count
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from accounts.serializers import UserSerializer, UserDetailSerializer
from accounts.models import Follow
from forum.serializers import TopicListSerializer, ReplySerializer
from interactions.serializers import ShareSerializer

User = get_user_model()


class CachedProfileMixin:
    def retrieve(self, request, *args, **kwargs):
        user = self.get_object()
        cache_key = f"profile:{user.id}"

        cached = cache.get(cache_key)
        if cached is None:
            cached = self._build_cached_profile(user, request)
            cache.set(cache_key, cached, 300)

        return Response({
            'id': user.id,
            'username': user.username,
            'bio': user.bio,
            'avatar': user.avatar,
            **cached,
            'is_following': (
                user.followers.filter(follower=request.user).exists()
                if request.user.is_authenticated else False
            ),
        })

    def _build_cached_profile(self, user, request):
        topics = list(
            user.topics.select_related('user').annotate(
                like_count=Count('likes', distinct=True), reply_count=Count('replies', distinct=True)
            )[:10]
        )
        topic_data = TopicListSerializer(topics, many=True, context={'request': request}).data

        replies = list(
            user.replies.select_related('user', 'topic')[:10]
        )
        reply_data = ReplySerializer(replies, many=True, context={'request': request}).data

        shares = list(
            user.shares.select_related('content_type').order_by('-created')[:10]
        )
        share_data = ShareSerializer(shares, many=True, context={'request': request}).data

        return {
            'topics': topic_data,
            'replies': reply_data,
            'shares': share_data,
            'topic_count': user.topics.count(),
            'reply_count': user.replies.count(),
            'share_count': user.shares.count(),
            'follower_count': user.followers.count(),
            'following_count': user.following.count(),
        }


class UserListView(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]


class UserDetailView(CachedProfileMixin, generics.RetrieveAPIView):
    queryset = User.objects.all()
    serializer_class = UserDetailSerializer
    permission_classes = [permissions.IsAuthenticated]


class CurrentUserView(CachedProfileMixin, generics.RetrieveAPIView):
    serializer_class = UserDetailSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def toggle_follow(request, user_id):
    target = get_object_or_404(User, id=user_id)
    if target == request.user:
        return Response({'error': 'You cannot follow yourself.'}, status=400)
    follow, created = Follow.objects.get_or_create(follower=request.user, following=target)
    if not created:
        follow.delete()
        return Response({'status': 'unfollowed', 'follower_count': target.followers.count()})
    return Response({'status': 'followed', 'follower_count': target.followers.count()})
