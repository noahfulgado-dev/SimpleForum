from django.contrib import admin
from django.urls import path, include
from dj_rest_auth.views import PasswordResetConfirmView, PasswordResetView
from rest_framework.permissions import AllowAny
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

# Views
from core.views import (
    TopicListView,
    TopicDetailView,
    ReplyCreateView,
    ReplyDeleteView,
    toggle_topic_like,
    toggle_reply_like,
)

schema_view = get_schema_view(
    openapi.Info(
        title="API Docs",
        default_version="v1",
        description="SimpleForum API"
    ),
    public=True,  # Update this to false before deploying
    permission_classes=[AllowAny],
)

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),

    # Authentication
    path('auth/', include("dj_rest_auth.urls")),
    path('auth/registration/', include("dj_rest_auth.registration.urls")),

    # Reset Password
    path('auth/password/reset/', PasswordResetView.as_view(), name="password_reset"),
    path(
        'auth/password/reset/confirm/<uidb64>/<str:token>/',
        PasswordResetConfirmView.as_view(),
        name="password_reset_confirm",
    ),

    # ========== FORUM ENDPOINTS ==========
    
    # Topics
    path('api/topics/', TopicListView.as_view(), name='topic-list'),
    path('api/topics/<int:pk>/', TopicDetailView.as_view(), name='topic-detail'),

    # Replies (nested under topics)
    path('api/topics/<int:topic_id>/replies/', ReplyCreateView.as_view(), name='reply-create'),
    path('api/replies/<int:pk>/', ReplyDeleteView.as_view(), name='reply-delete'),

    # Likes
    path('api/topics/<int:topic_id>/like/', toggle_topic_like, name='topic-like'),
    path('api/replies/<int:reply_id>/like/', toggle_reply_like, name='reply-like'),  # ✅ Fixed!

    # ========== API DOCUMENTATION ==========
    
    # Swagger URLs
    path('swagger<format>/', schema_view.without_ui(cache_timeout=0), name="schema-json"),
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name="schema-swagger-ui"),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name="schema-redoc"),
]