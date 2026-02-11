from django.contrib import admin
from .models import Customer

@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = (
        'name', 
        'phone', 
        'category_1', 
        'recycle_count', 
        'created_at'
    )
    search_fields = ('name', 'phone')
    list_filter = ('category_1', 'created_at')
    ordering = ('-created_at',)