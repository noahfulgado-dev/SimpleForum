from django.urls import path
from accounts.views import UserListView, UserDetailView, CurrentUserView, toggle_follow

urlpatterns = [
    path('users/', UserListView.as_view(), name='user-list'),
    path('users/me/', CurrentUserView.as_view(), name='user-me'),
    path('users/<int:pk>/', UserDetailView.as_view(), name='user-detail'),
    path('users/<int:user_id>/follow/', toggle_follow, name='user-follow'),
]
