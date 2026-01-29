from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # 1. 인증/계정 관련 (로그인, 회원가입) -> /api/v1/auth/...
    # Auth는 보통 router를 안 써서 따로 빼는 경우가 많음
    path('api/v1/auth/', include('apps.accounts.urls')), 
    
    # 2. 상담원 관련 -> /api/v1/agents/...
    path('api/v1/', include('apps.agents.urls')), 

    # 3. ✨ [추가] 고객 관련 -> /api/v1/customers/...
    path('api/v1/', include('apps.customers.urls')),  
]

