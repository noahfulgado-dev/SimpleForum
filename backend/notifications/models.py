from django.db import models
from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType


class Notification(models.Model):

    class VerbType(models.TextChoices):
        LIKED = 'liked', 'Liked'
        REPLIED = 'replied', 'Replied'

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='notifications'
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    verb = models.CharField(
        max_length=20,
        choices=VerbType.choices,
        default=VerbType.LIKED
    )

    target_ct = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )

    target_id = models.PositiveIntegerField(
        null=True,
        blank=True
    )

    target = GenericForeignKey('target_ct', 'target_id')

    count = models.PositiveIntegerField(default=1)
    is_read = models.BooleanField(default=False)
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created']
        constraints = [
            models.UniqueConstraint(
                fields=['recipient', 'verb', 'target_ct',
                        'target_id', 'is_read'],
                name='unique_unread_notification_per_target'
            )
        ]
