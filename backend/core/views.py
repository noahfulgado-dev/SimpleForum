from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db import IntegrityError

from core.models import Topic, Reply, Likes
from core.serializers import TopicSerializer, ReplySerializer


# ========== TOPIC VIEWS ==========

class TopicListView(generics.ListCreateAPIView):
    """List all topics or create a new one."""
    queryset = Topic.objects.all()
    serializer_class = TopicSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class TopicDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a topic."""
    queryset = Topic.objects.all()
    serializer_class = TopicSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


# ========== REPLY VIEWS ==========

class ReplyCreateView(generics.CreateAPIView):
    """Create a reply to a specific topic."""
    queryset = Reply.objects.all()
    serializer_class = ReplySerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        topic = get_object_or_404(Topic, id=self.kwargs['topic_id'])
        serializer.save(topic=topic, user=self.request.user)


class ReplyDeleteView(generics.DestroyAPIView):
    """Delete a reply (only the author can delete)."""
    queryset = Reply.objects.all()
    permission_classes = [IsAuthenticated]


# ========== LIKE VIEWS ==========

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_topic_like(request, topic_id):
    """Like or unlike a topic."""
    topic = get_object_or_404(Topic, id=topic_id)
    
    # Prevent liking your own topic (optional)
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
    
    # Prevent liking your own reply (optional)
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