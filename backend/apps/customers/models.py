from django.db import models

class Customer(models.Model):

    class Team(models.TextChoices):
        BATTERY = 'BATTERY', '배터리'
        MOBILITY = 'MOBILITY', '모빌리티'
        SOLAR = 'SOLAR', '태양광'
        MACHINE = 'MACHINE', '산업기계'

    # 상담 상태 정의 (Enum 역할)
    class Status(models.TextChoices):
        NEW = 'NEW', '접수(신규)'          # 아직 아무도 전화 안 함
        ASSIGNED = 'ASSIGNED', '배정됨'   # 상담원에게 넘어감
        TRYING = 'TRYING', '통화중'       # 몇 번 시도함
        REJECT = 'REJECT', '거절'         # 고객이 거부함
        SUCCESS = 'SUCCESS', '성공(계약)'  # 계약 성사!
        LATER = 'LATER', '재통화'         # 나중에 다시 걸어달라고 함
        INVALID = 'INVALID', '결번/오류'   # 없는 번호

    # 1. 기본 정보
    name = models.CharField(max_length=100, null=True, blank=True, verbose_name="고객명")
    phone = models.CharField(max_length=40, null=True, blank=True, unique=True, verbose_name="연락처") # 중복 DB 방지
    age = models.IntegerField(null=True, blank=True, verbose_name="나이")
    gender = models.CharField(max_length=10, null=True, blank=True, verbose_name="성별")
    region = models.CharField(max_length=255, null=True, blank=True, verbose_name="지역")

    team = models.CharField(
        max_length=20,
        choices=Team.choices,
        null=True,  # 기존 데이터 때문에 일단 null 허용
        blank=True,
        verbose_name="관심 분야(팀)"
    )

    # 2. 관리 정보
    status = models.CharField(
        max_length=20, 
        choices=Status.choices, 
        default=Status.NEW, 
        verbose_name="상담 상태"
    )
    assigned_agent = models.ForeignKey(
        'agents.Agent',
        on_delete=models.SET_NULL, # 상담원이 삭제돼도 고객 DB는 남아야 함 (중요!)
        null=True, 
        blank=True,
        related_name='customers',
        verbose_name="담당 상담원"
    )
    
    # 3. 추가 메타 데이터
    memo = models.TextField(blank=True, default="", verbose_name="관리자 메모")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="DB 생성일")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="마지막 수정일")
    assigned_at = models.DateTimeField(null=True, blank=True, verbose_name="배정일시")

    class Meta:
        db_table = 'tm_customers'
        verbose_name = '고객 DB'
        ordering = ['-created_at'] # 최신 DB부터 보여주기

    def __str__(self):
        name = self.name or "이름 없음"
        team = self.team or "미지정"
        return f"{name} - {team} ({self.status})"


class AssignmentLog(models.Model):
    class Status(models.TextChoices):
        SUCCESS = 'SUCCESS', '성공'
        PARTIAL_SUCCESS = 'PARTIAL_SUCCESS', '부분 성공'
        FAILURE = 'FAILURE', '실패'

    executed_at = models.DateTimeField(auto_now_add=True, verbose_name="실행 일시")
    triggered_by = models.CharField(max_length=50, default='SYSTEM', verbose_name="실행자")
    total_assigned = models.IntegerField(default=0, verbose_name="총 배정 건수")
    agent_count = models.IntegerField(default=0, verbose_name="참여 상담원 수") 
    result_detail = models.JSONField(default=dict, blank=True, verbose_name="상세 배정 내역")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.SUCCESS, verbose_name="상태")
    error_message = models.TextField(blank=True, null=True, verbose_name="에러 로그")

    class Meta:
        ordering = ['-executed_at']
        verbose_name = "자동 배정 이력"
        verbose_name_plural = "자동 배정 이력"
        db_table = 'tm_assignment_logs'

    def __str__(self):
        return f"[{self.executed_at.strftime('%Y-%m-%d %H:%M')}] {self.status} - {self.total_assigned}건"