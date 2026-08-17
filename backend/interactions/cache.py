from django.core.cache import cache

from forum.cache import get_content_version

PREFIX = "inter"
TTL = 300


def _key(kind, user_id, page):
    return f"{PREFIX}:{kind}:u{user_id}:p{page}:v{get_content_version()}"


def get_cached_interactions(kind, user_id, page):
    data = cache.get(_key(kind, user_id, page))
    if data is not None:
        return data["results"], data["count"]
    return None, None


def set_cached_interactions(kind, user_id, page, results, count):
    cache.set(_key(kind, user_id, page), {"results": results, "count": count}, TTL)