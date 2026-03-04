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
        INVALID = 'INVALID', '결번'       # 정산 제외 가능성 있음
        SUCCESS = 'SUCCESS', '성공(동의/계약)' # 다음 단계 이동 / 정산 대상
        BUY = 'BUY', '구매'
        HOLD = 'HOLD', '보류'
        CALLBACK = 'CALLBACK', '콜백 예약'
            
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
            # [수정] 1. 상담원별 오늘 배정량 및 상태 조회를 위한 핵심 인덱스
            # (assign_leads_to_agent 함수 내 range 조회 최적화)
            models.Index(fields=['agent', 'assigned_at'], name='idx_sales_agent_date'),

            # [추가] 2. 재활용 후보 조회를 위한 복합 인덱스 (매우 중요!)
            # (Exists 쿼리: 특정 고객이 현재 진행 중인지 빛의 속도로 확인)
            models.Index(fields=['customer', 'stage', 'status'], name='idx_sales_cust_stage_status'),

            # [추가] 3. 고객별 최신 배정 이력을 찾기 위한 인덱스
            # (_get_latest_assignment_queryset 최적화)
            models.Index(fields=['customer', 'assigned_at'], name='idx_sales_cust_latest_date'),

            # [유지] 4. 신규 DB 땡겨오기(미배정 데이터) 속도 향상
            # (status='NEW' 인 것들만 빠르게 모아보기)
            models.Index(fields=['stage', 'status', 'agent', 'assigned_at'], name='idx_sales_new_leads_flow'),
        ]

# [2] DB 땡겨오기 신청/승인 기록
class SalesPullRequest(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', '승인 대기'
        APPROVED = 'APPROVED', '승인'
        REJECTED = 'REJECTED', '거절'

    agent = models.ForeignKey(Agent, on_delete=models.CASCADE, related_name='pull_requests')
    requested_count = models.IntegerField(default=0, verbose_name="요청 수량")
    approved_count = models.IntegerField(default=0, verbose_name="승인 배정 수량")
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    request_note = models.TextField(blank=True, default="", verbose_name="요청 사유")
    reject_reason = models.TextField(blank=True, default="", verbose_name="거절 사유")
    processed_by = models.ForeignKey(
        Agent,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='processed_pull_requests',
        verbose_name="처리자"
    )
    processed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tm_sales_pull_requests'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'created_at'], name='sales_pull_status_created_idx'),
            models.Index(fields=['agent', 'status'], name='sales_pull_agent_status_idx'),
        ]

# [3] 통화 로그 (정산용)
# Call 모델로 이사 감

# [4] 자동 배정 시스템 로그 (sales로 이동됨)
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
