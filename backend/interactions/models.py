from django.conf import settings
from django.db import models
from django.core.exceptions import ValidationError
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType


class Likes(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='likes'
    )
    topic = models.ForeignKey(
        'forum.Topic',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='likes'
    )
    reply = models.ForeignKey(
        'forum.Reply',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='likes'
    )
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'topic'],
                name='unique_user_topic_like'
            ),
            models.UniqueConstraint(
                fields=['user', 'reply'],
                name='unique_user_reply_like'
            ),
        ]
        indexes = [
            models.Index(fields=['topic']),
            models.Index(fields=['reply']),
            models.Index(fields=['user', 'created']),
        ]
        db_table = 'core_likes'

    def clean(self):
        if self.topic and self.reply:
            raise ValidationError("A like cannot be for both a Topic and a Reply.")
        if not self.topic and not self.reply:
            raise ValidationError("A like must be for either a Topic or a Reply.")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        if self.topic:
            return f"{self.user.username} likes Topic: {self.topic.title}"
        if self.reply:
            return f"{self.user.username} likes Reply #{self.reply.id}"
        return f"{self.user.username}'s orphaned like"
    
class Bookmark(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='bookmarks')
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, limit_choices_to={'model__in': ['topic', 'reply']})
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey('content_type', 'object_id')
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['user', 'content_type', 'object_id'], name='unique_user_bookmark')   
        ]
        indexes = [
            models.Index(fields=['content_type', 'object_id']),
            models.Index(fields=['user', 'created']),
        ]

    def __str__(self):
        return f"{self.user.username} bookmarked {self.content_type.model} #{self.object_id}"

class Share(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='shares')
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, limit_choices_to={'model__in': ['topic', 'reply']})
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey('content_type', 'object_id')
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['user', 'content_type', 'object_id'], name='unique_user_share')
        ]
        indexes = [
            models.Index(fields=['content_type', 'object_id']),
            models.Index(fields=['user', 'created']),
        ]

    def __str__(self):
        return f"{self.user.username} shared {self.content_type.model} #{self.object_id}"
