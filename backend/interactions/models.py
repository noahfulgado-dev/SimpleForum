from django.conf import settings
from django.db import models
from django.core.exceptions import ValidationError


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
        return f"{self.user.username} likes Reply #{self.reply.id}"
