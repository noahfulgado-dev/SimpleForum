import logging
import threading

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.core.mail import send_mail
from django.db import close_old_connections
from django.db.models import Count, Subquery, OuterRef, Value
from django.db.models.functions import Coalesce
from django.shortcuts import get_object_or_404
from django.template.loader import render_to_string
from django.utils.translation import gettext_lazy as _
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.generics import GenericAPIView
from rest_framework.response import Response

from accounts.serializers import PasswordResetSerializer, frontend_password_reset_url

logger = logging.getLogger(__name__)


class PasswordResetView(GenericAPIView):
    serializer_class = PasswordResetSerializer
    permission_classes = []
    throttle_scope = 'dj_rest_auth'

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        print(f'[PW_RESET] Starting thread for {email}')

        def _send():
            from allauth.account.forms import default_token_generator
            try:
                close_old_connections()
                print(f'[PW_RESET] Thread running for {email}')
                User = get_user_model()
                users = list(User.objects.filter(email__iexact=email, is_active=True))
                print(f'[PW_RESET] Found {len(users)} users for {email}')
                for user in users:
                    temp_key = default_token_generator.make_token(user)
                    url = frontend_password_reset_url(None, user, temp_key)
                    print(f'[PW_RESET] URL generated: {url}')
                    context = {
                        'user': user,
                        'password_reset_url': url,
                        'key': temp_key,
                        'site_name': 'SimpleForum',
                    }
                    subject = 'Password Reset'
                    body = render_to_string(
                        'account/email/password_reset_key_message.txt',
                        context,
                    )
                    print(f'[PW_RESET] Template rendered, sending to {user.email}')
                    send_mail(
                        subject, body,
                        settings.DEFAULT_FROM_EMAIL,
                        [user.email],
                    )
                    print(f'[PW_RESET] Email sent to {user.email}')
                    logger.info('Password reset email sent to %s', user.email)
            except Exception as e:
                print(f'[PW_RESET] ERROR: {e}')
                logger.exception('Failed to send password reset email')

        thread = threading.Thread(target=_send)
        thread.start()
        print(f'[PW_RESET] Thread started, returning response')
        return Response(
            {'detail': _('Password reset e-mail has been sent.')},
            status=status.HTTP_200_OK,
        )


@api_view(['POST'])
@permission_classes([])
def test_email(request):
    email = request.data.get('email', '')
    print(f'[TEST_EMAIL] Sending test to {email}')
    send_mail(
        'Test Email from SimpleForum',
        'If you receive this, SMTP is configured correctly.',
        settings.DEFAULT_FROM_EMAIL,
        [email],
    )
    print(f'[TEST_EMAIL] Sent to {email}')
    return Response({'detail': 'Test email sent'})

from accounts.serializers import UserSerializer, UserDetailSerializer
from accounts.models import Follow
from forum.serializers import TopicListSerializer, ReplySerializer
from interactions.serializers import ShareSerializer
from interactions.models import Likes

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
            'is_online': user.is_online,
            'last_seen': user.last_seen,
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

        topic_likes_subq = Likes.objects.filter(topic__user=OuterRef('pk')).values('topic__user').annotate(count=Count('*')).values('count')
        reply_likes_subq = Likes.objects.filter(reply__user=OuterRef('pk')).values('reply__user').annotate(count=Count('*')).values('count')

        counts = User.objects.filter(pk=user.pk).annotate(
            topic_count=Count('topics', distinct=True),
            reply_count=Count('replies', distinct=True),
            share_count=Count('shares', distinct=True),
            follower_count=Count('followers', distinct=True),
            following_count=Count('following', distinct=True),
            total_likes=Coalesce(Subquery(topic_likes_subq), Value(0)) + Coalesce(Subquery(reply_likes_subq), Value(0)),
        ).values('topic_count', 'reply_count', 'share_count', 'follower_count', 'following_count', 'total_likes').first()

        return {
            'topics': topic_data,
            'replies': reply_data,
            'shares': share_data,
            'topic_count': counts['topic_count'],
            'reply_count': counts['reply_count'],
            'share_count': counts['share_count'],
            'follower_count': counts['follower_count'],
            'following_count': counts['following_count'],
            'total_likes': counts['total_likes'],
        }


class UserListView(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]


class FollowingListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    ordering = ['-last_seen', 'username']

    def get_queryset(self):
        return User.objects.filter(followers__follower=self.request.user)


class UserDetailView(CachedProfileMixin, generics.RetrieveAPIView):
    queryset = User.objects.all()
    serializer_class = UserDetailSerializer
    permission_classes = [permissions.IsAuthenticated]


class CurrentUserView(CachedProfileMixin, generics.RetrieveUpdateAPIView):
    serializer_class = UserDetailSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def perform_update(self, serializer):
        serializer.save()
        cache.delete(f"profile:{self.request.user.id}")


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def upload_avatar(request):
    file = request.FILES.get('avatar')
    if not file:
        return Response({'error': 'No image file provided.'}, status=400)

    if file.size > 5 * 1024 * 1024:
        return Response({'error': 'Image must be under 5MB.'}, status=400)

    from accounts.utils import upload_to_imgbb, ImgBBUploadError

    try:
        url = upload_to_imgbb(file)
    except ImgBBUploadError as e:
        return Response({'error': str(e)}, status=e.status_code)

    user = request.user
    user.avatar = url
    user.save(update_fields=['avatar'])
    return Response({'avatar': url})


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def toggle_follow(request, user_id):
    target = get_object_or_404(User, id=user_id)
    if target == request.user:
        return Response({'error': 'You cannot follow yourself.'}, status=400)
    follow, created = Follow.objects.get_or_create(follower=request.user, following=target)
    cache.delete(f"profile:{request.user.id}")
    cache.delete(f"profile:{target.id}")
    if not created:
        follow.delete()
        return Response({'status': 'unfollowed', 'follower_count': target.followers.count()})
    return Response({'status': 'followed', 'follower_count': target.followers.count()})
