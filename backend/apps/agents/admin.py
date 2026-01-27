from django.contrib import admin
from .models import Agent

# Register your models here.
@admin.register(Agent)
class AgentAdmin(admin.ModelAdmin):
    list_display = ('name', 'role', 'status', 'daily_cap', 'account_email')
    search_field = ('name', 'account__email')
    list_filter = ('role','status')


    def account_email(self, obj):
        return obj.account.email
    account_email.short_description='계정 이메일'