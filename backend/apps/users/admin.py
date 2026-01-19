#AgentProfile을 따로 메뉴로 두지 않고, 유저 수정 화면 안에 쏙(Inline) 넣어서 한 번에 관리하게 만들기
from django.contrib import admin
from .models import User, AgentProfile

# [1] 프로필을 유저 관리 화면 안에 끼워넣기 (Inline)
class AgentProfileInline(admin.StackedInline):
    model = AgentProfile
    can_delete = False
    verbose_name_plural = '상담원 업무 프로필'

# [2] 유저 관리자 설정
@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('login_id', 'name', 'role', 'is_active', 'created_at')
    list_filter = ('role', 'is_active')
    search_fields = ('login_id', 'name')
    
    # 상세 화면에서 프로필도 같이 보여줌
    inlines = [AgentProfileInline]