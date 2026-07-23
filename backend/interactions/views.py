from rest_framework import generics
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.contrib.contenttypes.models import ContentType

from forum.models import Topic, Reply
from interactions.models import Likes, Bookmark, Share
from interactions.serializers import BookmarkSerializer


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_topic_like(request, topic_id):
    topic = get_object_or_404(Topic, id=topic_id)

    if topic.user == request.user:
        return Response({'error': 'You cannot like your own topic.'}, status=400)

    like, created = Likes.objects.get_or_create(user=request.user, topic=topic)

    if not created:
        like.delete()
        return Response({
            'status': 'unliked',
            'like_count': topic.likes.count()
        })

    return Response({
        'status': 'liked',
        'like_count': topic.likes.count()
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_reply_like(request, reply_id):
    reply = get_object_or_404(Reply, id=reply_id)

    if reply.user == request.user:
        return Response({'error': 'You cannot like your own reply.'}, status=400)

    like, created = Likes.objects.get_or_create(user=request.user, reply=reply)

    if not created:
        like.delete()
        return Response({
            'status': 'unliked',
            'like_count': reply.likes.count()
        })

    return Response({
        'status': 'liked',
        'like_count': reply.likes.count()
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_topic_bookmark(request, topic_id):
    topic = get_object_or_404(Topic, id=topic_id)
    topic_type = ContentType.objects.get_for_model(Topic)

    bookmark, created = Bookmark.objects.get_or_create(
        user=request.user,
        content_type=topic_type,
        object_id=topic.id
    )

    if not created:
        bookmark.delete()
        return Response({
            'status': 'unbookmarked',
            'bookmark_count': Bookmark.objects.filter(content_type=topic_type, object_id=topic.id).count()
        })

    return Response({
        'status': 'bookmarked',
        'bookmark_count': Bookmark.objects.filter(content_type=topic_type, object_id=topic.id).count()
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_reply_bookmark(request, reply_id):
    reply = get_object_or_404(Reply, id=reply_id)
    reply_type = ContentType.objects.get_for_model(Reply)

    bookmark, created = Bookmark.objects.get_or_create(
        user=request.user,
        content_type=reply_type,
        object_id=reply.id
    )

    if not created:
        bookmark.delete()
        return Response({
            'status': 'unbookmarked',
            'bookmark_count': Bookmark.objects.filter(content_type=reply_type, object_id=reply.id).count()
        })

    return Response({
        'status': 'bookmarked',
        'bookmark_count': Bookmark.objects.filter(content_type=reply_type, object_id=reply.id).count()
    })


class UserBookmarkListView(generics.ListAPIView):
    serializer_class = BookmarkSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Bookmark.objects.filter(
            user=self.request.user
        ).select_related(
            'content_type'
        ).prefetch_related(
            'content_object'
        ).order_by('-created')



@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_topic_share(request, topic_id):
    topic = get_object_or_404(Topic, id=topic_id)
    topic_type = ContentType.objects.get_for_model(Topic)

    share, created = Share.objects.get_or_create(
        user=request.user,
        content_type=topic_type,
        object_id=topic.id
    )

    if not created:
        share.delete()
        return Response({
            'status': 'unshared',
            'shared_count': Share.objects.filter(content_type=topic_type, object_id=topic.id).count()
        })

    return Response({
        'status': 'shared',
        'shared_count': Share.objects.filter(content_type=topic_type, object_id=topic.id).count()
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_reply_sharek(request, reply_id):
    reply = get_object_or_404(Reply, id=reply_id)
    reply_type = ContentType.objects.get_for_model(Reply)

    share, created = Share.objects.get_or_create(
        user=request.user,
        content_type=reply_type,
        object_id=reply.id
    )

    if not created:
        share.delete()
        return Response({
            'status': 'unshared',
            'shared_count': Share.objects.filter(content_type=reply_type, object_id=reply.id).count()
        })

    return Response({
        'status': 'shared',
        'shared_count': Share.objects.filter(content_type=reply_type, object_id=reply.id).count()
    })
