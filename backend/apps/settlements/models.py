from django.db import models
from apps.agents.models import Agent


class SettlementStatus(models.TextChoices):
    PENDING = 'PENDING', '지급 대기'
    REVIEW = 'REVIEW', '검토 필요'
    PAID = 'PAID', '지급 완료'


class SettlementViewType(models.TextChoices):
    MONTH = 'MONTH', '월'
    DAY = 'DAY', '일'
    WEEK = 'WEEK', '주'
    RANGE = 'RANGE', '기간'


class Settlement(models.Model):
    agent = models.ForeignKey(Agent, on_delete=models.CASCADE, related_name='settlements')
    period_start = models.DateField()
    period_end = models.DateField()
    view_type = models.CharField(max_length=10, choices=SettlementViewType.choices, default=SettlementViewType.MONTH)

    status = models.CharField(max_length=10, choices=SettlementStatus.choices, default=SettlementStatus.PENDING)
    note = models.TextField(blank=True, default='')

    success_count = models.IntegerField(default=0)
    reject_count = models.IntegerField(default=0)
    invalid_count = models.IntegerField(default=0)
    absence_count = models.IntegerField(default=0)

    calculated_amount = models.IntegerField(default=0)
    final_amount = models.IntegerField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tm_settlements'
        ordering = ['-period_start', 'agent__user__name']
        constraints = [
            models.UniqueConstraint(
                fields=['agent', 'period_start', 'period_end', 'view_type'],
                name='uniq_settlement_agent_period_view'
            )
        ]
        indexes = [
            models.Index(fields=['period_start', 'period_end'], name='idx_settlement_period'),
            models.Index(fields=['status'], name='idx_settlement_status'),
        ]

    def resolved_amount(self):
        return self.final_amount if self.final_amount is not None else self.calculated_amount


class SettlementPrice(models.Model):
    success_price = models.IntegerField(default=2000)
    reject_price = models.IntegerField(default=700)
    invalid_price = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tm_settlement_prices'
        ordering = ['-created_at']
