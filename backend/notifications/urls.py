from django.urls import path
from . import views

urlpatterns = [
    path('notifications/', views.NotificationListView.as_view(), name='notification-list'),
    path('notifications/<int:pk>/read/', views.MarkNotificationReadView.as_view(), name='notification-read'),
    path('notifications/read-all/', views.MarkAllNotificationsReadView.as_view(), name='notification-read-all'),
    path('notifications/unread-count/', views.UnreadNotificationCountView.as_view(), name='notification-unread-count'),
]