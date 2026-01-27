from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CustomerViewSet

router = DefaultRouter()
# 여기서 'customers'라고 등록하면 -> /api/v1/customers/ 가 됩니다.
router.register(r'customers', CustomerViewSet) 

urlpatterns = [
    path('', include(router.urls)),
]