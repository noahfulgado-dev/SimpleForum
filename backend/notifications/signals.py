from django.db.models.signals import post_save
from django.dispatch import receiver

from forum.models import Reply
from interactions.models import Likes
from notifications.models import Notification
from .utils import create_notification


@receiver(post_save, sender=Reply)
def on_reply_created(sender, instance, created, **kwargs):
    if not created:
        return
    topic = instance.topic
    if topic.user:
        create_notification(
            actor=instance.user,
            recipient=topic.user,
            verb=Notification.VerbType.REPLIED,
            target=topic,
        )


@receiver(post_save, sender=Likes)
def on_like_created(sender, instance, created, **kwargs):
    if not created:
        return
    target = instance.topic or instance.reply
    if not target:
        return
    recipient = target.user
    if recipient:
        create_notification(
            actor=instance.user,
            recipient=recipient,
            verb=Notification.VerbType.LIKED,
            target=target,
        )