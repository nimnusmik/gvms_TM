# apps/customers/admin.py
from django.contrib import admin
from .models import Customer, AutoAssignLog


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ['name', 'phone', 'status', 'created_at']
    search_fields = ['name', 'phone']
    list_filter = ['status']


@admin.register(AutoAssignLog)
class AutoAssignLogAdmin(admin.ModelAdmin):
    list_display = ('executed_at', 'status', 'total_assigned', 'agent_count', 'message')
    list_filter = ('status', 'executed_at')
    readonly_fields = ('executed_at', 'status', 'total_assigned', 'agent_count', 'message') # 로그는 수정 못하게 막기
    ordering = ('-executed_at',)
    
    def has_add_permission(self, request):
        return False # 관리자가 수동으로 로그를 만들 필요는 없음