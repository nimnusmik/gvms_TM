from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SalesAssignmentViewSet

router = DefaultRouter()
router.register(r'', SalesAssignmentViewSet, basename='sales')

urlpatterns = [
    path('', include(router.urls)),
]
