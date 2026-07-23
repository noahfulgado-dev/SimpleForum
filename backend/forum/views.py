from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied
from django.shortcuts import get_object_or_404
from django.db.models import Count, Exists, OuterRef, Value, BooleanField
from django.contrib.contenttypes.models import ContentType

from forum.models import Topic, Reply
from forum.serializers import TopicSerializer, ReplySerializer
from interactions.models import Likes, Bookmark, Share


class TopicListView(generics.ListCreateAPIView):
    queryset = Topic.objects.select_related('user').prefetch_related(
        'replies__user',
    ).annotate(
        like_count=Count('likes'), reply_count=Count('replies')
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
                ),
            )
        return qs.annotate(
            user_has_liked=Value(False, output_field=BooleanField()),
            user_has_bookmarked=Value(False, output_field=BooleanField()),
            user_has_shared=Value(False, output_field=BooleanField())
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class TopicDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Topic.objects.select_related('user').prefetch_related(
        'replies__user',
    ).annotate(
        like_count=Count('likes'), reply_count=Count('replies')
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

    def perform_destroy(self, instance):
        if instance.user != self.request.user and not self.request.user.is_staff:
            raise PermissionDenied("You do not have permission to delete this topic.")
        instance.delete()


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
