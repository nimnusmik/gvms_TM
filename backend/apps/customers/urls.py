# apps/customers/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CustomerViewSet, CustomerUploadView

router = DefaultRouter()
router.register(r'', CustomerViewSet) 

urlpatterns = [
    # 1. 커스텀 기능 (업로드)
    # 최종 URL: /api/v1/customers/upload_excel/
    path('upload_excel/', CustomerUploadView.as_view(), name='customer-upload'),

    # 2. 기본 CRUD (Router)
    path('', include(router.urls)),
]