from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # 1. 인증
    path('api/v1/auth/', include('apps.accounts.urls')), 
    
    # 2. 상담원 
    path('api/v1/agents/', include('apps.agents.urls')), 

    # 3. 고객 
    path('api/v1/customers/', include('apps.customers.urls')),  

    # 4. 공지사항 
    path('api/v1/notices/', include('apps.notices.urls')),  

    # 5. 영업현황
    path('api/v1/sales/', include('apps.sales.urls')), 

    # 6. 상담결과
    path('api/v1/calls/', include('apps.calls.urls')), 

]

