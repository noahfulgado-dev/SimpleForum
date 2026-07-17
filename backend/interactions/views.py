from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from forum.models import Topic, Reply
from interactions.models import Likes


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
