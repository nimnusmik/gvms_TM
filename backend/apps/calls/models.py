from django.db import models
from apps.agents.models import Agent
from apps.sales.models import SalesAssignment


class CallLog(models.Model):
    class Result(models.TextChoices):
        SUCCESS = 'SUCCESS', '동의'
        REJECT = 'REJECT', '거절'
        ABSENCE = 'ABSENCE', '부재'
        INVALID = 'INVALID', '결번'

    assignment = models.ForeignKey(
        SalesAssignment,
        on_delete=models.CASCADE,
        related_name='call_logs',
        verbose_name="영업 배정 건"
    )
    agent = models.ForeignKey(
        Agent,
        on_delete=models.CASCADE,
        related_name='call_history',
        verbose_name="상담원"
    )

    call_start = models.DateTimeField(verbose_name="통화 시작")
    call_duration = models.IntegerField(default=0, verbose_name="통화 시간(초)")
    result_type = models.CharField(max_length=50, choices=Result.choices, verbose_name="통화 결과")
    is_billable = models.BooleanField(default=True)
    recording_file = models.FileField(upload_to='recordings/%Y/%m/', null=True, blank=True)
    recording_status = models.CharField(
        max_length=20,
        choices=[
            ('PENDING', '업로드 대기'),
            ('UPLOADED', '업로드 완료'),
            ('FAILED', '업로드 실패'),
        ],
        default='PENDING',
    )
    recording_mime = models.CharField(max_length=100, null=True, blank=True)
    recording_size = models.IntegerField(null=True, blank=True)
    recording_uploaded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'tm_call_logs'
