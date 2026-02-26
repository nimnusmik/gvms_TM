from django.contrib import admin

from .models import Settlement, SettlementPrice


@admin.register(Settlement)
class SettlementAdmin(admin.ModelAdmin):
    list_display = (
        'agent',
        'period_start',
        'period_end',
        'view_type',
        'status',
        'calculated_amount',
        'final_amount',
        'updated_at',
    )
    list_filter = ('status', 'view_type')
    search_fields = ('agent__user__name',)


@admin.register(SettlementPrice)
class SettlementPriceAdmin(admin.ModelAdmin):
    list_display = ('success_price', 'reject_price', 'invalid_price', 'updated_at')
