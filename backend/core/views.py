from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.exceptions import PermissionDenied
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User
from django.db.models import Count

from core.models import Topic, Reply, Likes
from core.serializers import TopicSerializer, ReplySerializer, UserSerializer, UserDetailSerializer
from core.permissions import IsAuthorOrAdmin


# ========== USER VIEWS ==========

class UserListView(generics.ListAPIView):
    """ List all users with basic info."""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

class UserDetailView(generics.RetrieveAPIView):
    """ Get a specific user with their topics and replies"""
    queryset = User.objects.all()
    serializer_class = UserDetailSerializer
    permission_classes = [IsAuthenticated]

class CurrentUserView(generics.RetrieveAPIView):
    """ Get the current user's profile with their topics and replies."""
    serializer_class = UserDetailSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        """ Return the current authenticated user"""
        return self.request.user


# ========== TOPIC VIEWS ==========

class TopicListView(generics.ListCreateAPIView):
    """List all topics or create a new one."""
    queryset = Topic.objects.select_related('user').prefetch_related(
        'replies__user',
        'likes'
    ).annotate(like_count=Count('likes'))
    serializer_class = TopicSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class TopicDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete a topic.
    - Anyone can view (GET)
    - Only author or admin can edit/delete (PUT/DELETE)
    """
    queryset = Topic.objects.select_related('user').prefetch_related(
        'replies__user',
        'likes'
    ).annotate(like_count=Count('likes'))
    serializer_class = TopicSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def perform_update(self, serializer):
        """Only allow author or admin to update."""
        topic = self.get_object()
        if topic.user != self.request.user and not self.request.user.is_staff:
            raise PermissionDenied("You do not have permission to edit this topic.")
        serializer.save()

    def perform_destroy(self, instance):
        """Only allow author or admin to delete."""
        if instance.user != self.request.user and not self.request.user.is_staff:
            raise PermissionDenied("You do not have permission to delete this topic.")
        instance.delete()


# ========== REPLY VIEWS ==========

class ReplyCreateView(generics.CreateAPIView):
    """Create a reply to a specific topic."""
    queryset = Reply.objects.all()
    serializer_class = ReplySerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        topic = get_object_or_404(Topic, id=self.kwargs['topic_id'])
        serializer.save(topic=topic, user=self.request.user)


class ReplyDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete a reply.
    - Anyone authenticated can view (GET)
    - Only author or admin can edit/delete (PUT/PATCH/DELETE)
    """
    queryset = Reply.objects.select_related('user', 'topic').prefetch_related('likes')
    serializer_class = ReplySerializer
    permission_classes = [IsAuthenticated]

    def perform_update(self, serializer):
        reply = self.get_object()
        if reply.user != self.request.user and not self.request.user.is_staff:
            raise PermissionDenied("You do not have permission to edit this reply.")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.user != self.request.user and not self.request.user.is_staff:
            raise PermissionDenied("You do not have permission to delete this reply.")
        instance.delete()


# ========== LIKE VIEWS ==========

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_topic_like(request, topic_id):
    """Like or unlike a topic."""
    topic = get_object_or_404(Topic, id=topic_id)
    
    # Prevent liking your own topic
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
    """Like or unlike a reply."""
    reply = get_object_or_404(Reply, id=reply_id)
    
    # Prevent liking your own reply
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