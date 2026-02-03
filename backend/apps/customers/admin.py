from django.contrib import admin
from .models import Customer, AssignmentLog

@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ('name', 'phone', 'team', 'status', 'assigned_agent', 'created_at')
    list_filter = ('status', 'team', 'created_at')
    search_fields = ('name', 'phone', 'memo')
    ordering = ('-created_at',)

@admin.register(AssignmentLog)
class AssignmentLogAdmin(admin.ModelAdmin):
    # 목록에 보여줄 컬럼
    list_display = ('executed_at', 'status_badge', 'total_assigned', 'agent_count', 'triggered_by')
    
    # 필터
    list_filter = ('status', 'executed_at', 'triggered_by')
    
    # 상세 페이지 (읽기 전용)
    readonly_fields = ('executed_at', 'triggered_by', 'status', 'total_assigned', 'agent_count', 'error_message', 'result_detail')
    
    fieldsets = (
        ('기본 정보', {
            'fields': ('executed_at', 'triggered_by', 'status')
        }),
        ('실행 결과 요약', {
            'fields': ('total_assigned', 'agent_count')
        }),
        ('상세 내역', {
            'fields': ('error_message', 'result_detail'),
            'classes': ('collapse',), # 기본적으로는 접어둠
        }),
    )

    # 상태에 따라 색상 뱃지 표시 (선택 사항)
    def status_badge(self, obj):
        from django.utils.html import format_html
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