import uuid 
import random
import string
from django.db import models
from django.conf import settings

# Create your models here.
class AgentRole(models.TextChoices):
    ADMIN = 'ADMIN', '관리자'
    MANAGER = 'MANAGER', '매니저'
    AGENT = 'AGENT', '상담원'


class AgentStatus(models.TextChoices):
    OFFLINE = 'OFFLINE', '오프라인',
    ONLINE = 'ONLINE', '온라인',
    BREAK = 'BREAK', '휴식중',
    BUSY = 'BUSY', '통화중'

class Team(models.TextChoices):
        BATTERY = 'BATTERY', '배터리'
        MOBILITY = 'MOBILITY', '모빌리티'
        SOLAR = 'SOLAR', '태양광'
        MACHINE = 'MACHINE', '산업기계'

class Agent(models.Model):
    team = models.CharField(
        max_length=20, 
        choices=Team.choices, 
        null=True,   
        blank=True,  
        verbose_name="소속 팀"
    )

    agent_id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    account = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete = models.CASCADE,
        related_name = 'agent_profile'
    )

    name = models.CharField(max_length = 50)
    assigned_phone = models.CharField(max_length=20, null=True, blank=True)

    role = models.CharField(
        max_length=10,
        choices=AgentRole.choices,
        default=AgentRole.AGENT
    )
    
    status = models.CharField(
        max_length=10,
        choices=AgentStatus.choices,
        default=AgentStatus.OFFLINE
    )

    daily_cap = models.IntegerField(default=50)
    is_auto_assign =models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    code = models.CharField(
        max_length=20, 
        unique=True, 
        editable=False, # 관리자가 직접 수정 못하게 막음 (자동생성)
        null=True       # 기존 데이터가 있다면 마이그레이션 에러 방지용 (나중에 필수값으로 변경 가능)
    )

    def save(self, *args, **kwargs):
        if not self.code:
            self.code = self.generate_unique_code()
        super().save(*args, **kwargs)

    def generate_unique_code(self):
        prefix = "TM"
        
        while True:
            # 영문대문자+숫자 섞어서 6자리 생성 (예: 9A2B3C)
            random_chars = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
            new_code = f"{prefix}-{random_chars}"
            
            # 진짜 유니크한지 확인 (혹시나 겹치면 다시 뽑기)
            if not Agent.objects.filter(code=new_code).exists():
                return new_code

    class Meta:
        db_table = 'tm_agents'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.get_role_display()})"
    