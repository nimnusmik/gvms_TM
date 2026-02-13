from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SalesAssignmentViewSet, SalesPullRequestViewSet

router = DefaultRouter()
# 특정 prefix가 빈 prefix에 의해 잡히지 않도록 먼저 등록
router.register(r'pull-requests', SalesPullRequestViewSet, basename='sales-pull-requests')
router.register(r'', SalesAssignmentViewSet, basename='sales')

urlpatterns = [
    path('', include(router.urls)),
]
