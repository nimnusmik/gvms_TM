from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CallLogViewSet

router = DefaultRouter()
router.register(r'logs', CallLogViewSet, basename='call-logs')

urlpatterns = [
    path('', include(router.urls)),
]