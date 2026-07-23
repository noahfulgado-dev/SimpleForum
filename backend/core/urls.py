from django.contrib import admin
from django.urls import path, include
from rest_framework.permissions import AllowAny
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

from core.auth_urls import auth_urlpatterns, registration_urlpatterns
from core.views import health

schema_view = get_schema_view(
    openapi.Info(
        title="API Docs",
        default_version="v1",
        description="SimpleForum API"
    ),
    public=True,
    permission_classes=[AllowAny],
)

urlpatterns = [
    path('health/', health, name='health'),
    path('admin/', admin.site.urls),

    path('auth/', include(auth_urlpatterns)),
    path('auth/registration/', include(registration_urlpatterns)),

    path('accounts/', include('allauth.urls')),

    path('api/', include('accounts.urls')),
    path('api/', include('forum.urls')),
    path('api/', include('interactions.urls')),
    path('api/', include('notifications.urls')),

    path('swagger<format>/', schema_view.without_ui(cache_timeout=0), name="schema-json"),
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name="schema-swagger-ui"),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name="schema-redoc"),
]