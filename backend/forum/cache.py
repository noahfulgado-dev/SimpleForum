from django.core.cache import cache

PREFIX = "tl"
TTL = 300


def _ver():
    v = cache.get(f"{PREFIX}:ver")
    if v is None:
        v = 1
        cache.set(f"{PREFIX}:ver", v, None)
    return v


def _page_key(page):
    return f"{PREFIX}:p{page}:v{_ver()}"


def get_cached_topic_ids(page):
    data = cache.get(_page_key(page))
    if data is not None:
        return data["ids"], data["total"]
    return None, None


def set_cached_topic_ids(page, ids, total):
    cache.set(_page_key(page), {"ids": ids, "total": total}, TTL)


def clear_topic_cache():
    try:
        cache.incr(f"{PREFIX}:ver")
    except ValueError:
        cache.set(f"{PREFIX}:ver", 2, None)
