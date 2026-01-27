from django.db import models
from apps.agents.models import Agent # 상담원 모델 import

class Customer(models.Model):
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

    # 2. 관리 정보
    status = models.CharField(
        max_length=20, 
        choices=Status.choices, 
        default=Status.NEW, 
        verbose_name="상담 상태"
    )
    assigned_agent = models.ForeignKey(
        Agent, 
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

    class Meta:
        db_table = 'tm_customers'
        verbose_name = '고객 DB'
        ordering = ['-created_at'] # 최신 DB부터 보여주기

    def __str__(self):
        return f"{self.name} ({self.status})"