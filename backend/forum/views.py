from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied
from django.shortcuts import get_object_or_404
from django.db.models import Count

from forum.models import Topic, Reply
from forum.serializers import TopicSerializer, ReplySerializer


class TopicListView(generics.ListCreateAPIView):
    queryset = Topic.objects.select_related('user').prefetch_related(
        'replies__user',
        'likes'
    ).annotate(like_count=Count('likes'))
    serializer_class = TopicSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class TopicDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Topic.objects.select_related('user').prefetch_related(
        'replies__user',
        'likes'
    ).annotate(like_count=Count('likes'))
    serializer_class = TopicSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

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
        serializer.save(topic=topic, user=self.request.user)


class ReplyDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Reply.objects.select_related('user', 'topic').prefetch_related('likes')
    serializer_class = ReplySerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_update(self, serializer):
        reply = self.get_object()
        if reply.user != self.request.user and not self.request.user.is_staff:
            raise PermissionDenied("You do not have permission to edit this reply.")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.user != self.request.user and not self.request.user.is_staff:
            raise PermissionDenied("You do not have permission to delete this reply.")
        instance.delete()
