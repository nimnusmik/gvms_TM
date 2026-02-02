from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CustomerViewSet, CustomerUploadView

router = DefaultRouter()
# 여기서 'customers'라고 등록하면 -> /api/v1/customers/ 가 됩니다.
router.register(r'customers', CustomerViewSet) 

urlpatterns = [
    # 🌟 순서 중요: router.urls보다 위에 적어주세요.
    # POST /api/v1/customers/upload/
    path('upload/', CustomerUploadView.as_view(), name='customer-upload'),

    #나머지 CRUD
    path('', include(router.urls)),
]