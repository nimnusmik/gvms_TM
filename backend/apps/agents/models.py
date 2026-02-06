import uuid 
import random
import string
from django.db import models
from django.conf import settings

# 1. Enum 정의  
class AgentRole(models.TextChoices):
    ADMIN = 'ADMIN', '관리자'
    MANAGER = 'MANAGER', '매니저'
    AGENT = 'AGENT', '상담원'

class AgentStatus(models.TextChoices):
    OFFLINE = 'OFFLINE', '오프라인' 
    ONLINE = 'ONLINE', '온라인'
    BREAK = 'BREAK', '휴식중'
    BUSY = 'BUSY', '통화중'
    RESIGNED = 'RESIGNED', '퇴사'

class Team(models.TextChoices):
    SALES_1 = 'SALES_1', '영업 1팀'

# 2. 모델 정의
class Agent(models.Model):
    # PK는 맨 위에 두는 게 관례입니다
    agent_id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    # 1:1 관계 - 한 명의 유저는 오직 하나의 상담원 프로필만 가질 수 있다
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='agent_profile'
    )

    # Account에서 가져오자
    # name = models.CharField(max_length=50, verbose_name="상담원 이름")
    
    # 업무용 폰 
    assigned_phone = models.CharField(
        max_length=20, 
        null=True, 
        blank=True, 
        verbose_name="직통 번호"
    )

    # 업무 설정
    team = models.CharField(
        max_length=20, 
        choices=Team.choices, 
        null=True,   
        blank=True,  
        verbose_name="소속 팀"
    )
    
    role = models.CharField(
        max_length=10,
        choices=AgentRole.choices,
        default=AgentRole.AGENT,
        verbose_name="권한"
    )
    
    status = models.CharField(
        max_length=10,
        choices=AgentStatus.choices,
        default=AgentStatus.OFFLINE,
        verbose_name="현재 상태"
    )

    daily_cap = models.IntegerField(default=50, verbose_name="일일 할당량")
    is_auto_assign = models.BooleanField(default=True, verbose_name="자동 배정 여부")

    # 사번 (자동 생성)
    code = models.CharField(
        max_length=20, 
        unique=True, 
        editable=False, 
        null=True,
        verbose_name="사원 번호"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'tm_agents'
        ordering = ['-created_at']
        verbose_name = '상담원 프로필'

    def __str__(self):
        return f"{self.user.name} ({self.get_role_display()})"

    # 저장 시 사번 자동 생성 로직
    def save(self, *args, **kwargs):
        if not self.code:
            self.code = self.generate_unique_code()
        super().save(*args, **kwargs)

    def generate_unique_code(self):
        prefix = "TM"
        while True:
            random_chars = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
            new_code = f"{prefix}-{random_chars}"
            if not Agent.objects.filter(code=new_code).exists():
                return new_code
