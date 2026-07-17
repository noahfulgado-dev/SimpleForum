from django.urls import path
from forum.views import TopicListView, TopicDetailView, ReplyCreateView, ReplyDetailView

urlpatterns = [
    path('topics/', TopicListView.as_view(), name='topic-list'),
    path('topics/<int:pk>/', TopicDetailView.as_view(), name='topic-detail'),
    path('topics/<int:topic_id>/replies/', ReplyCreateView.as_view(), name='reply-create'),
    path('replies/<int:pk>/', ReplyDetailView.as_view(), name='reply-detail'),
]
