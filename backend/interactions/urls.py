from django.urls import path
from interactions.views import toggle_topic_like, toggle_reply_like, toggle_topic_bookmark, toggle_reply_bookmark, UserBookmarkListView

urlpatterns = [
    path('topics/<int:topic_id>/like/', toggle_topic_like, name='topic-like'),
    path('replies/<int:reply_id>/like/', toggle_reply_like, name='reply-like'),
    path('topics/<int:topic_id>/bookmark/', toggle_topic_bookmark, name='topic-bookmark'),
    path('replies/<int:reply_id>/bookmark/', toggle_reply_bookmark, name='reply-bookmark'),
    path('bookmarks/', UserBookmarkListView.as_view(), name='user-bookmarks'),
]
