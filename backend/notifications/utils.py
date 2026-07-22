from datetime import timedelta

from django.utils import timezone
from django.contrib.contenttypes.models import ContentType

from .models import Notification

def create_notification(actor, recipient, verb, target):
    if not actor or actor == recipient:
        return

    cooldown = timedelta(minutes=30)

    existing = Notification.objects.filter(
        recipient=recipient,
        verb=verb,
        target_ct=ContentType.objects.get_for_model(target),
        target_id=target.id,
        is_read=False,
        created__gte=timezone.now() - cooldown,
    ).first()

    if existing:
        existing.count += 1
        existing.save(update_fields=['count'])
    else:
        Notification.objects.create(
            recipient=recipient,
            actor=actor,
            verb=verb,
            target=target
        )