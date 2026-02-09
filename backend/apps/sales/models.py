# backend/apps/sales/models.py
from django.db import models
from apps.customers.models import Customer
from apps.agents.models import Agent

# [1] 영업 배정 기록 (1차/2차/재활용 통합 관리)
class SalesAssignment(models.Model):
    class Stage(models.TextChoices):
        FIRST = '1ST', '1차 TM'
        SECOND = '2ND', '2차 영업'

    class Status(models.TextChoices):
        NEW = 'NEW', '대기(미배정)'      # 땡겨오기 전
        ASSIGNED = 'ASSIGNED', '배정됨' # 내꺼
        TRYING = 'TRYING', '통화중'
        REJECT = 'REJECT', '거절'         # 재활용 대상
        ABSENCE = 'ABSENCE', '부재'
        INVALID = 'INVALID', '결번'       # 정산 제외 가능성 있음
        SUCCESS = 'SUCCESS', '성공(동의/계약)' # 다음 단계 이동 / 정산 대상
        BUY = 'BUY', '구매'
        REFUSAL = 'REFUSAL', '거절'
        HOLD = 'HOLD', '보류'
            
    class Sentiment(models.TextChoices):
        HIGH = 'HIGH', '상'
        MID = 'MID', '중'
        LOW = 'LOW', '하'

    # 관계 설정
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='assignments')
    agent = models.ForeignKey(Agent, on_delete=models.SET_NULL, null=True, related_name='assignments', blank=True)
    
    # 1차->2차 추적용 (부모 배정 기록)
    parent_assignment = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='child_assignments')

    # 상태 데이터
    stage = models.CharField(max_length=10, choices=Stage.choices, default=Stage.FIRST)
    
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.NEW)
    
    # 상담원 입력 데이터
    sentiment = models.CharField(max_length=10, choices=Sentiment.choices, null=True, blank=True)
    item_interested = models.CharField(max_length=100, null=True, blank=True, verbose_name="관심 아이템")
    memo = models.TextField(blank=True, default="", verbose_name="상담 메모")
    
    assigned_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tm_sales_assignments'
        indexes = [
            models.Index(fields=['agent', 'stage', 'status']),
            models.Index(fields=['status']), # 땡겨오기 속도 향상
        ]

# [2] 통화 로그 (정산용)
# Call 모델로 이사 감

# [3] 자동 배정 시스템 로그 (sales로 이동됨)
class AssignmentLog(models.Model):
    class Status(models.TextChoices):
        SUCCESS = 'SUCCESS', '성공'
        FAILURE = 'FAILURE', '실패'

    executed_at = models.DateTimeField(auto_now_add=True)
    triggered_by = models.CharField(max_length=50, default='SYSTEM')
    total_assigned = models.IntegerField(default=0)
    agent_count = models.IntegerField(default=0, verbose_name="참여 상담원 수")
    result_detail = models.JSONField(default=dict, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.SUCCESS)
    error_message = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'tm_assignment_logs'
