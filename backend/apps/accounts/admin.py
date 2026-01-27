# 관리자페이지 설정 파일
from django.contrib import admin
from .models import Account, MemberLevel

# 1. 등급(Level) 관리자 페이지
@admin.register(MemberLevel)
class MemberLevelAdmin(admin.ModelAdmin):
    list_display = ('level_id', 'level_name')

# 2. 계정(Account) 관리자 페이지
@admin.register(Account) 
class AccountAdmin(admin.ModelAdmin):
    # 실제 존재하는 필드들로 채워줍니다.
    list_display = ('account_id', 'email', 'level', 'is_active', 'created_at') # 엑셀처럼 원하는 항목만 뽑아서 표로 보여줌
    
    # 클릭해서 수정할 수 있는 링크 걸기
    list_display_links = ('email',)
    
    # 검색 기능 (이메일로 검색)
    search_fields = ('email',)
    
    # 필터 기능 (등급별, 활성상태별 보기)
    list_filter = ('level', 'is_active')
    
    # 수정 페이지에서 보여줄 필드 순서
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('권한 및 등급', {'fields': ('level', 'is_active', 'is_staff', 'is_superuser')}),
        ('날짜 정보', {'fields': ('last_login_at',)}), # created_at은 자동이라 보통 숨김
    )
    
    # 읽기 전용 필드 설정 (생성일 등)
    readonly_fields = ('last_login_at', 'created_at')