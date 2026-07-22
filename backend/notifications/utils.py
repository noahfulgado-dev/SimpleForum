from datetime import timedelta

from django.utils import timezone
from django.contrib.contenttypes.models import ContentType

from .models import Notification

def create_notification(actor, recipient, verb, target):
    if not actor or actor == recipient:
        return

    cooldown = timedelta(minutes=30)
    cutoff = timezone.now() - cooldown

    existing = Notification.objects.filter(
        recipient=recipient,
        verb=verb,
        target_ct=ContentType.objects.get_for_model(target),
        target_id=target.id,
        is_read=False,
    ).first()

    if existing:
        if existing.created >= cutoff:
            existing.count += 1
            existing.save(update_fields=['count'])
        else:
            existing.count = 1
            existing.created = timezone.now()
            existing.actor = actor
            existing.save(update_fields=['count', 'created', 'actor'])
    else:
        Notification.objects.create(
            recipient=recipient,
            actor=actor,
            verb=verb,
            target=target,
        )