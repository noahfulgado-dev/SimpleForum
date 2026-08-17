from django.core.cache import cache

PREFIX = "tl"
TTL = 300


def _ver():
    v = cache.get(f"{PREFIX}:ver")
    if v is None:
        v = 1
        cache.set(f"{PREFIX}:ver", v, None)
    return v


def _page_key(user_id, page):
    return f"{PREFIX}:u{user_id}:p{page}:v{_ver()}"


def get_cached_topic_page(user_id, page):
    data = cache.get(_page_key(user_id, page))
    if data is not None:
        return data["results"], data["count"]
    return None, None


def set_cached_topic_page(user_id, page, results, count):
    cache.set(_page_key(user_id, page), {"results": results, "count": count}, TTL)


def get_content_version():
    return _ver()


def get_cached_topic_detail(user_id, topic_id):
    return cache.get(f"{PREFIX}:d:u{user_id}:t{topic_id}:v{_ver()}")


def set_cached_topic_detail(user_id, topic_id, payload):
    cache.set(f"{PREFIX}:d:u{user_id}:t{topic_id}:v{_ver()}", payload, TTL)


def clear_topic_cache():
    try:
        cache.incr(f"{PREFIX}:ver")
    except ValueError:
        cache.set(f"{PREFIX}:ver", 2, None)
