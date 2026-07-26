from django.conf import settings
from django.db import models
from django.utils import timezone


class Topic(models.Model):
    title = models.CharField(max_length=200)
    description = models.CharField(max_length=500)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='topics'
    )
    created = models.DateTimeField()
    updated = models.DateTimeField()

    def save(self, *args, **kwargs):
        now = timezone.now()
        if self.pk is None:
            self.created = now
        self.updated = now
        super().save(*args, **kwargs)

    class Meta:
        ordering = ['-created']
        db_table = 'core_topic'
        indexes = [
            models.Index(fields=['-created']),
        ]


class Reply(models.Model):
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE, related_name='replies')
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE, related_name='children')
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='replies'
    )
    content = models.TextField()
    created = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Reply by {self.user.username if self.user else 'deleted'} on {self.topic.title}"

    class Meta:
        ordering = ['created']
        db_table = 'core_reply'
