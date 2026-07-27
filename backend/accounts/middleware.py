from django.utils import timezone
from django.core.cache import cache


class UpdateLastSeenMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.user.is_authenticated:
            cache_key = f"last_seen_throttle:{request.user.id}"
            if not cache.get(cache_key):
                cache.set(cache_key, True, 60)
                User = request.user.__class__
                User.objects.filter(pk=request.user.pk).update(last_seen=timezone.now())
        return self.get_response(request)
