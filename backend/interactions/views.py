from collections import OrderedDict

from rest_framework import generics
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.core.cache import cache
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.prefetch import GenericPrefetch

from forum.annotations import annotate_reply_qs, annotate_topic_qs
from forum.models import Topic, Reply
from forum.cache import clear_topic_cache
from interactions.cache import get_cached_interactions, set_cached_interactions
from interactions.models import Likes, Bookmark, Share
from interactions.serializers import BookmarkSerializer, ShareSerializer


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_topic_like(request, topic_id):
    topic = get_object_or_404(Topic, id=topic_id)

    if topic.user == request.user:
        return Response({'error': 'You cannot like your own topic.'}, status=400)

    like, created = Likes.objects.get_or_create(user=request.user, topic=topic)

    if not created:
        like.delete()
        cache.delete(f"profile:{topic.user.id}")
        clear_topic_cache()
        return Response({
            'status': 'unliked',
            'like_count': topic.likes.count()
        })

    cache.delete(f"profile:{topic.user.id}")
    clear_topic_cache()
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
        cache.delete(f"profile:{reply.user.id}")
        clear_topic_cache()
        return Response({
            'status': 'unliked',
            'like_count': reply.likes.count()
        })

    cache.delete(f"profile:{reply.user.id}")
    clear_topic_cache()
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
        clear_topic_cache()
        return Response({
            'status': 'unbookmarked',
            'bookmark_count': Bookmark.objects.filter(content_type=topic_type, object_id=topic.id).count()
        })

    clear_topic_cache()
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
        clear_topic_cache()
        return Response({
            'status': 'unbookmarked',
            'bookmark_count': Bookmark.objects.filter(content_type=reply_type, object_id=reply.id).count()
        })

    clear_topic_cache()
    return Response({
        'status': 'bookmarked',
        'bookmark_count': Bookmark.objects.filter(content_type=reply_type, object_id=reply.id).count()
    })


class UserBookmarkListView(generics.ListAPIView):
    serializer_class = BookmarkSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Bookmark.objects.filter(
            user=user
        ).select_related(
            'content_type'
        ).prefetch_related(
            GenericPrefetch('content_object', [
                annotate_topic_qs(Topic.objects.select_related('user'), user),
                annotate_reply_qs(
                    Reply.objects.select_related('user', 'topic').prefetch_related('likes'),
                    user,
                ),
            ])
        ).order_by('-created')

    def list(self, request, *args, **kwargs):
        page = request.query_params.get(self.paginator.page_query_param, 1)
        cached_results, cached_count = get_cached_interactions('bm', request.user.id, page)

        if cached_results is not None and cached_count is not None:
            page_size = self.paginator.get_page_size(request)
            total_pages = (cached_count - 1) // page_size + 1
            current = int(page)
            next_url = request.build_absolute_uri(f"?page={current + 1}") if current < total_pages else None
            previous_url = request.build_absolute_uri(f"?page={current - 1}") if current > 1 else None
            return Response(OrderedDict([
                ('count', cached_count),
                ('next', next_url),
                ('previous', previous_url),
                ('results', cached_results),
            ]))

        qs = self.filter_queryset(self.get_queryset())
        page_obj = self.paginate_queryset(qs)
        serializer = self.get_serializer(page_obj, many=True)
        set_cached_interactions('bm', request.user.id, page, serializer.data, self.paginator.page.paginator.count)
        return self.get_paginated_response(serializer.data)



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
        cache.delete(f"profile:{request.user.id}")
        cache.delete(f"profile:{topic.user.id}")
        clear_topic_cache()
        return Response({
            'status': 'unshared',
            'shared_count': Share.objects.filter(content_type=topic_type, object_id=topic.id).count()
        })

    cache.delete(f"profile:{request.user.id}")
    cache.delete(f"profile:{topic.user.id}")
    clear_topic_cache()
    return Response({
        'status': 'shared',
        'shared_count': Share.objects.filter(content_type=topic_type, object_id=topic.id).count()
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_reply_share(request, reply_id):
    reply = get_object_or_404(Reply, id=reply_id)
    reply_type = ContentType.objects.get_for_model(Reply)

    share, created = Share.objects.get_or_create(
        user=request.user,
        content_type=reply_type,
        object_id=reply.id
    )

    if not created:
        share.delete()
        cache.delete(f"profile:{request.user.id}")
        cache.delete(f"profile:{reply.user.id}")
        clear_topic_cache()
        return Response({
            'status': 'unshared',
            'shared_count': Share.objects.filter(content_type=reply_type, object_id=reply.id).count()
        })

    cache.delete(f"profile:{request.user.id}")
    cache.delete(f"profile:{reply.user.id}")
    clear_topic_cache()
    return Response({
        'status': 'shared',
        'shared_count': Share.objects.filter(content_type=reply_type, object_id=reply.id).count()
    })

class UserShareListView(generics.ListAPIView):
    serializer_class = ShareSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Share.objects.filter(
            user=user
        ).select_related(
            'content_type'
        ).prefetch_related(
            GenericPrefetch('content_object', [
                annotate_topic_qs(Topic.objects.select_related('user'), user),
                annotate_reply_qs(
                    Reply.objects.select_related('user', 'topic').prefetch_related('likes'),
                    user,
                ),
            ])
        ).order_by('-created')

    def list(self, request, *args, **kwargs):
        page = request.query_params.get(self.paginator.page_query_param, 1)
        cached_results, cached_count = get_cached_interactions('sh', request.user.id, page)

        if cached_results is not None and cached_count is not None:
            page_size = self.paginator.get_page_size(request)
            total_pages = (cached_count - 1) // page_size + 1
            current = int(page)
            next_url = request.build_absolute_uri(f"?page={current + 1}") if current < total_pages else None
            previous_url = request.build_absolute_uri(f"?page={current - 1}") if current > 1 else None
            return Response(OrderedDict([
                ('count', cached_count),
                ('next', next_url),
                ('previous', previous_url),
                ('results', cached_results),
            ]))

        qs = self.filter_queryset(self.get_queryset())
        page_obj = self.paginate_queryset(qs)
        serializer = self.get_serializer(page_obj, many=True)
        set_cached_interactions('sh', request.user.id, page, serializer.data, self.paginator.page.paginator.count)
        return self.get_paginated_response(serializer.data)
