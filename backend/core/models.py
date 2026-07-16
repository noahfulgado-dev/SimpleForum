from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError

class Topic(models.Model):
    title = models.CharField(max_length=200)
    description = models.CharField(max_length=500)
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        related_name='topics' # To do topics.all()
    )
    created = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.title
    
    class Meta:
        ordering = ['-created']  # Newest topics first

class Reply(models.Model):
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE,  related_name='replies')
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='replies'
    )
    content = models.TextField()
    created = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Reply by {self.user.username if self.user else 'Anonymous'} on {self.topic.title}"

class Likes(models.Model):
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE,
        related_name='likes'
    )
    topic = models.ForeignKey(
        Topic, 
        on_delete=models.CASCADE,
        null=True, 
        blank=True,
        related_name='likes'
    )
    reply = models.ForeignKey(
        Reply, 
        on_delete=models.CASCADE,
        null=True, 
        blank=True,
        related_name='likes'
    )
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        # Prevent duplicate likes
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
        # Add indexes for performance
        indexes = [
            models.Index(fields=['topic']),
            models.Index(fields=['reply']),
            models.Index(fields=['user', 'created']),
        ]

    def clean(self):
        """Ensure a like is for either a Topic or a Reply, but not both."""
        if self.topic and self.reply:
            raise ValidationError("A like cannot be for both a Topic and a Reply.")
        if not self.topic and not self.reply:
            raise ValidationError("A like must be for either a Topic or a Reply.")

    def save(self, *args, **kwargs):
        self.full_clean()  # Run validation before saving
        super().save(*args, **kwargs)

    def __str__(self):
        if self.topic:
            return f"{self.user.username} likes Topic: {self.topic.title}"
        return f"{self.user.username} likes Reply #{self.reply.id}"