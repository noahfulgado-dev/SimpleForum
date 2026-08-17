from django.contrib.contenttypes.models import ContentType
from django.db.models import BooleanField, Count, Exists, OuterRef, Subquery, Value
from django.db.models.functions import Coalesce

from forum.models import Topic, Reply
from interactions.models import Likes, Bookmark, Share


def annotate_topic_qs(qs, user):
    topic_ct = ContentType.objects.get_for_model(Topic)
    base = qs.annotate(
        like_count=Count('likes', distinct=True),
        reply_count=Count('replies', distinct=True),
        shared_count=Coalesce(
            Subquery(
                Share.objects.filter(content_type=topic_ct, object_id=OuterRef('pk'))
                .values('object_id').annotate(count=Count('id')).values('count')[:1]
            ),
            Value(0)
        ),
    )
    if user.is_authenticated:
        return base.annotate(
            user_has_liked=Exists(Likes.objects.filter(user=user, topic=OuterRef('pk'))),
            user_has_bookmarked=Exists(Bookmark.objects.filter(user=user, content_type=topic_ct, object_id=OuterRef('pk'))),
            user_has_shared=Exists(Share.objects.filter(user=user, content_type=topic_ct, object_id=OuterRef('pk'))),
        )
    return base.annotate(
        user_has_liked=Value(False, output_field=BooleanField()),
        user_has_bookmarked=Value(False, output_field=BooleanField()),
        user_has_shared=Value(False, output_field=BooleanField()),
    )


def annotate_reply_qs(qs, user):
    reply_ct = ContentType.objects.get_for_model(Reply)
    base = qs.annotate(
        shared_count=Coalesce(
            Subquery(
                Share.objects.filter(content_type=reply_ct, object_id=OuterRef('pk'))
                .values('object_id').annotate(count=Count('id')).values('count')[:1]
            ),
            Value(0)
        ),
    )
    if user.is_authenticated:
        return base.annotate(
            user_has_liked=Exists(Likes.objects.filter(user=user, reply=OuterRef('pk'))),
            user_has_bookmarked=Exists(Bookmark.objects.filter(user=user, content_type=reply_ct, object_id=OuterRef('pk'))),
            user_has_shared=Exists(Share.objects.filter(user=user, content_type=reply_ct, object_id=OuterRef('pk'))),
        )
    return base.annotate(
        user_has_liked=Value(False, output_field=BooleanField()),
        user_has_bookmarked=Value(False, output_field=BooleanField()),
        user_has_shared=Value(False, output_field=BooleanField()),
    )