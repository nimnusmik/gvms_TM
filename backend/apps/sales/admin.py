from django.contrib import admin
from django.utils.html import format_html
from .models import SalesAssignment, AssignmentLog

# [1] 영업 배정 기록 관리
@admin.register(SalesAssignment)
class SalesAssignmentAdmin(admin.ModelAdmin):
    list_display = ('customer', 'agent', 'stage', 'status', 'updated_at')
    list_filter = ('stage', 'status', 'agent')
    search_fields = ('customer__name', 'customer__phone', 'agent__user__name')
    raw_id_fields = ('customer', 'agent')

# [2] 통화 기록 관리

# [3] 자동 배정 로그 관리 (이사 온 코드)
@admin.register(AssignmentLog)
class AssignmentLogAdmin(admin.ModelAdmin):
    list_display = ('executed_at', 'status_badge', 'total_assigned', 'agent_count', 'triggered_by')
    list_filter = ('status', 'executed_at', 'triggered_by')
    readonly_fields = ('executed_at', 'triggered_by', 'status', 'total_assigned', 'agent_count', 'error_message', 'result_detail')
    
    # 상세 페이지 레이아웃
    fieldsets = (
        ('기본 정보', {'fields': ('executed_at', 'triggered_by', 'status')}),
        ('실행 결과 요약', {'fields': ('total_assigned', 'agent_count')}),
        ('상세 내역', {'fields': ('error_message', 'result_detail'), 'classes': ('collapse',)}),
    )

    def status_badge(self, obj):
        colors = {
            'SUCCESS': 'green',
            'PARTIAL_SUCCESS': 'orange',
            'FAILURE': 'red',
        }
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            colors.get(obj.status, 'black'),
            obj.get_status_display()
        )
    status_badge.short_description = "상태"