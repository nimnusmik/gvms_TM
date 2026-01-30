# apps/customers/admin.py

from django.contrib import admin
from .models import Customer

# ✅ 이것만 남겨주세요
@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ['name', 'phone', 'status', 'created_at']
    search_fields = ['name', 'phone']
    list_filter = ['status']