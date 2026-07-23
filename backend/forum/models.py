from django.conf import settings
from django.db import models


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
    created = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

    class Meta:
        ordering = ['-created']
        db_table = 'core_topic'


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
        return f"Reply by {self.user.username if self.user else 'Anonymous'} on {self.topic.title}"

    class Meta:
        ordering = ['created']
        db_table = 'core_reply'
