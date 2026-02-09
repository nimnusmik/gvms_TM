from django.db import models
from apps.agents.models import Agent
from apps.customers.models import Customer
from apps.sales.models import SalesAssignment

class CallLog(models.Model):
    # --- [1] Enum 정의 (엑셀 기준) ---
    class CallType(models.TextChoices):
        OUTBOUND = 'OUTBOUND', '아웃바운드'
        INBOUND = 'INBOUND', '인바운드'

    class Result(models.TextChoices):
        SUCCESS = 'SUCCESS', '동의 (상담 성공)' 
        REJECT = 'REJECT', '거절'
        ABSENCE = 'ABSENCE', '부재'
        WRONG_NUMBER = 'WRONG_NUMBER', '결번/오류'
        BUSY = 'BUSY', '통화중'
        LATER = 'LATER', '보류/재통화'

    class Sentiment(models.TextChoices):
        HIGH = 'HIGH', '상 (긍정)'
        MID = 'MID', '중 (보통)'
        LOW = 'LOW', '하 (부정)'

    # --- [2] 관계 설정 ---
    agent = models.ForeignKey(Agent, on_delete=models.SET_NULL, null=True, related_name='call_history', verbose_name="상담원")
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='call_history', verbose_name="고객")
    # 어떤 영업 배정 건에서 건 전화인지 연결
    assignment = models.ForeignKey(SalesAssignment, on_delete=models.CASCADE, related_name='call_logs', verbose_name="영업 배정 건")

    # --- [3] 기본 통화 정보 ---
    call_type = models.CharField(max_length=20, choices=CallType.choices, default=CallType.OUTBOUND, verbose_name="유형")
    result = models.CharField(max_length=20, choices=Result.choices, verbose_name="통화 결과")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="통화 시점") # 엑셀의 '통화시간'

    # --- [4] 📝 엑셀 메모 데이터화 (핵심!) ---
    # "이승호 담당자님"
    recipient_name = models.CharField(max_length=50, null=True, blank=True, verbose_name="수신자/담당자명")
    
    # "7094lsh@hanmail.net"
    recipient_email = models.EmailField(max_length=255, null=True, blank=True, verbose_name="수집 이메일")
    
    # "010-XXXX-XXXX"
    recipient_mobile = models.CharField(max_length=20, null=True, blank=True, verbose_name="수집 휴대폰")

    # "고객감도 상"
    sentiment = models.CharField(max_length=10, choices=Sentiment.choices, null=True, blank=True, verbose_name="고객 감도")
    
    # "전동지게차 카달로그..."
    item_interested = models.CharField(max_length=255, null=True, blank=True, verbose_name="관심 아이템")

    # 나머지 잡다한 메모 내용
    memo = models.TextField(blank=True, default="", verbose_name="통화 메모")

    # --- [5] 시스템 데이터 (정산용) ---
    duration = models.IntegerField(default=0, verbose_name="통화 시간(초)")
    is_billable = models.BooleanField(default=True, verbose_name="정산 대상")
    recording_file = models.FileField(upload_to='recordings/%Y/%m/%d/', null=True, blank=True)

    # --- [6] 이력 추적 (통계용) ---
    status_before = models.CharField(max_length=50, blank=True, null=True)
    status_after = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        db_table = 'tm_call_logs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['agent', 'created_at']),
            models.Index(fields=['result']),
            models.Index(fields=['sentiment']), 
        ]

    def __str__(self):
        return f"[{self.created_at}] {self.agent} -> {self.customer} ({self.get_result_display()})"