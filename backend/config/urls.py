from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # 1. 인증
    path('api/v1/auth/', include('apps.accounts.urls')), 
    
    # 2. 상담원 (URL을 여기서 명시)
    path('api/v1/agents/', include('apps.agents.urls')), 

    # 3. 고객 (URL을 여기서 명시) 👈 이렇게 바꿉니다!
    path('api/v1/customers/', include('apps.customers.urls')),  
]

