from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # 1. 인증/계정 관련 (로그인, 회원가입) -> /api/v1/auth/...
    path('api/v1/auth/', include('apps.accounts.urls')), 
    
    # 2. 상담원 관련 -> /api/v1/agents/...
    path('api/v1/', include('apps.agents.urls')), 

    # 3. ✨ [추가] 고객 관련 -> /api/v1/customers/...
    # apps.customers.urls 안에 router가 'customers'를 달고 있으므로
    # 여기서는 그냥 api/v1/으로 include 해주는 게 일반적입니다.
    path('api/v1/', include('apps.customers.urls')), 
]