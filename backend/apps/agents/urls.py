from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AgentViewSet, DashboardStatsView

router = DefaultRouter()
router.register(r'agents', AgentViewSet)

urlpatterns = [
    path('agents/dashboard-stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('', include(router.urls)),
]