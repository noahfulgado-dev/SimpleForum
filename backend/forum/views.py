from collections import OrderedDict

from rest_framework import filters, generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import BooleanField, Case, Count, Exists, ExpressionWrapper, F, FloatField, IntegerField, OuterRef, Subquery, Value, When
from django.db.models.functions import Coalesce, Extract, Now
from django.contrib.contenttypes.models import ContentType
from django.core.cache import cache

from accounts.utils import upload_to_imgbb
from forum.cache import clear_topic_cache, get_cached_topic_ids, set_cached_topic_ids
from forum.models import Topic, Reply
from forum.serializers import TopicListSerializer, TopicSerializer, ReplySerializer
from interactions.models import Likes, Bookmark, Share


class TopicListView(generics.ListCreateAPIView):
    serializer_class = TopicListSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'description']

    def _build_annotated_qs(self, qs):
        user = self.request.user
        topic_type = ContentType.objects.get_for_model(Topic)
        from django.db import connection

        if connection.vendor == 'postgresql':
            base = qs.select_related('user').annotate(
                like_count=Count('likes', distinct=True),
                reply_count=Count('replies', distinct=True),
                hot_score=ExpressionWrapper(
                    F('like_count') * 3.0 + F('reply_count') * 2.0
                    - Extract(Now() - F('created'), 'epoch') / 86400.0 * 2.0,
                    output_field=FloatField()
                ),
            )
        else:
            base = qs.select_related('user').annotate(
                like_count=Count('likes', distinct=True),
                reply_count=Count('replies', distinct=True),
                hot_score=ExpressionWrapper(
                    F('like_count') * 3.0 + F('reply_count') * 2.0,
                    output_field=FloatField()
                ),
            )

        if user.is_authenticated:
            return base.annotate(
                user_has_liked=Exists(Likes.objects.filter(user=user, topic=OuterRef('pk'))),
                user_has_bookmarked=Exists(Bookmark.objects.filter(user=user, content_type=topic_type, object_id=OuterRef('pk'))),
                user_has_shared=Exists(Share.objects.filter(user=user, content_type=topic_type, object_id=OuterRef('pk'))),
                shared_count=Coalesce(
                    Subquery(
                        Share.objects.filter(content_type=topic_type, object_id=OuterRef('pk'))
                        .values('object_id').annotate(count=Count('id')).values('count')[:1]
                    ),
                    Value(0)
                ),
            )
        return base.annotate(
            user_has_liked=Value(False, output_field=BooleanField()),
            user_has_bookmarked=Value(False, output_field=BooleanField()),
            user_has_shared=Value(False, output_field=BooleanField()),
            shared_count=Coalesce(
                Subquery(
                    Share.objects.filter(content_type=topic_type, object_id=OuterRef('pk'))
                    .values('object_id').annotate(count=Count('id')).values('count')[:1]
                ),
                Value(0)
            ),
        )

    def list(self, request, *args, **kwargs):
        search = request.query_params.get('search')

        if search:
            qs = self._build_annotated_qs(Topic.objects.all())
            qs = self.filter_queryset(qs)
            page_obj = self.paginate_queryset(qs)
            serializer = self.get_serializer(page_obj, many=True)
            return self.get_paginated_response(serializer.data)

        page = request.query_params.get(self.paginator.page_query_param, 1)
        cached_ids, cached_total = get_cached_topic_ids(page)

        if cached_ids is not None and cached_total is not None:
            preserved = Case(
                *[When(id=id, then=Value(i)) for i, id in enumerate(cached_ids)],
                output_field=IntegerField(),
            )
            qs = self._build_annotated_qs(
                Topic.objects.filter(id__in=cached_ids).order_by(preserved)
            )
            topics = list(qs)
            total = cached_total
        else:
            qs = self._build_annotated_qs(Topic.objects.all()).order_by('-hot_score', '-created')
            page_obj = self.paginate_queryset(qs)
            topics = list(page_obj)
            total = self.paginator.page.paginator.count

            ids = [t.id for t in topics]
            if ids:
                set_cached_topic_ids(page, ids, total)

        serializer = self.get_serializer(topics, many=True)

        if cached_ids is not None:
            page_size = self.paginator.get_page_size(request)
            total_pages = (total - 1) // page_size + 1
            current = int(page)
            next_url = request.build_absolute_uri(f"?page={current + 1}") if current < total_pages else None
            previous_url = request.build_absolute_uri(f"?page={current - 1}") if current > 1 else None
            return Response(OrderedDict([
                ('count', total),
                ('next', next_url),
                ('previous', previous_url),
                ('results', serializer.data),
            ]))

        return self.get_paginated_response(serializer.data)

    def perform_create(self, serializer):
        topic = serializer.save(user=self.request.user)
        cache.delete(f"profile:{topic.user.id}")


class TopicDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Topic.objects.select_related('user').prefetch_related(
        'replies__user',
    ).annotate(
        like_count=Count('likes', distinct=True), reply_count=Count('replies', distinct=True)
    )
    serializer_class = TopicSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.is_authenticated:
            topic_type = ContentType.objects.get_for_model(Topic)
            return qs.annotate(
                user_has_liked=Exists(
                    Likes.objects.filter(user=user, topic=OuterRef('pk'))
                ),
                user_has_bookmarked=Exists(
                    Bookmark.objects.filter(user=user, content_type=topic_type, object_id=OuterRef('pk'))
                ),
                user_has_shared=Exists(
                    Share.objects.filter(user=user, content_type=topic_type, object_id=OuterRef('pk'))
                )
            )
        return qs.annotate(
            user_has_liked=Value(False, output_field=BooleanField()),
            user_has_bookmarked=Value(False, output_field=BooleanField()),
            user_has_shared=Value(False, output_field=BooleanField())
        )

    def perform_update(self, serializer):
        topic = self.get_object()
        if topic.user != self.request.user and not self.request.user.is_staff:
            raise PermissionDenied("You do not have permission to edit this topic.")
        serializer.save()
        cache.delete(f"profile:{topic.user.id}")
        clear_topic_cache()

    def perform_destroy(self, instance):
        if instance.user != self.request.user and not self.request.user.is_staff:
            raise PermissionDenied("You do not have permission to delete this topic.")
        instance.delete()
        cache.delete(f"profile:{instance.user.id}")
        clear_topic_cache()


class ReplyCreateView(generics.CreateAPIView):
    queryset = Reply.objects.all()
    serializer_class = ReplySerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        topic = get_object_or_404(Topic, id=self.kwargs['topic_id'])
        parent = serializer.validated_data.get('parent')
        if parent and parent.topic != topic:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'parent': 'Parent reply must belong to the same topic.'})
        serializer.save(topic=topic, user=self.request.user)
        cache.delete(f"profile:{self.request.user.id}")


class ReplyDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Reply.objects.select_related('user', 'topic')
    serializer_class = ReplySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.is_authenticated:
            reply_type = ContentType.objects.get_for_model(Reply)
            return qs.annotate(
                user_has_liked=Exists(
                    Likes.objects.filter(user=user, reply=OuterRef('pk'))
                ),
                user_has_bookmarked=Exists(
                    Bookmark.objects.filter(user=user, content_type=reply_type, object_id=OuterRef('pk'))
                ),
                user_has_shared=Exists(
                    Share.objects.filter(user=user, content_type=reply_type, object_id=OuterRef('pk'))
                )
            )
        return qs.annotate(
            user_has_liked=Value(False, output_field=BooleanField()),
            user_has_bookmarked=Value(False, output_field=BooleanField()),
            user_has_shared=Value(False, output_field=BooleanField())
        )

    def perform_update(self, serializer):
        reply = self.get_object()
        if reply.user != self.request.user and not self.request.user.is_staff:
            raise PermissionDenied("You do not have permission to edit this reply.")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.user != self.request.user and not self.request.user.is_staff:
            raise PermissionDenied("You do not have permission to delete this reply.")
        instance.delete()


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def upload_topic_image(request, pk):
    topic = get_object_or_404(Topic, pk=pk)

    if topic.user != request.user and not request.user.is_staff:
        raise PermissionDenied("You do not have permission to edit this topic.")

    if 'image' not in request.FILES:
        return Response({'error': 'No image provided.'}, status=status.HTTP_400_BAD_REQUEST)

    topic.image = upload_to_imgbb(request.FILES['image'])
    topic.save(update_fields=['image'])
    cache.delete(f"profile:{topic.user.id}")
    clear_topic_cache()

    return Response({'image': topic.image})
