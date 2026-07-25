from django.core.cache import cache

PREFIX = "tl"
TTL = 30


def get_cached_topic_ids(page):
    data = cache.get(f"{PREFIX}:p{page}")
    if data is not None:
        return data["ids"], data["total"]
    return None, None


def set_cached_topic_ids(page, ids, total):
    cache.set(f"{PREFIX}:p{page}", {"ids": ids, "total": total}, TTL)
