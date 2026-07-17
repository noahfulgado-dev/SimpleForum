from django.urls import path
from interactions.views import toggle_topic_like, toggle_reply_like

urlpatterns = [
    path('topics/<int:topic_id>/like/', toggle_topic_like, name='topic-like'),
    path('replies/<int:reply_id>/like/', toggle_reply_like, name='reply-like'),
]
