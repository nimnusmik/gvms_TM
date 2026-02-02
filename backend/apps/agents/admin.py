from django.contrib import admin
from .models import Agent

@admin.register(Agent)
class AgentAdmin(admin.ModelAdmin):
    list_display = [
        'agent_id', 
        'get_user_name', 
        'team', 
        'role', 
        'status', 
        'created_at'
    ]
    
    # 성능 최적화 (User 정보 미리 로딩)
    list_select_related = ['user']

    # 이름 가져오는 함수 정의
    def get_user_name(self, obj):
        return obj.user.name  
    
    # 관리자 페이지 컬럼 제목 설정
    get_user_name.short_description = '상담원 이름'
    get_user_name.admin_order_field = 'user__name'