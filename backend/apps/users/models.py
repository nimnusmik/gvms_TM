# Create your models here.
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from apps.common.models import BaseModel # 공통 모델 상속
import uuid

class UserManager(BaseUserManager):
    def create_user(self, login_id, name, password=None, **extra_fields):
        if not login_id:
            raise ValueError('Users must have a login_id')
        user = self.model(login_id=login_id, name=name, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, login_id, name, password):
        user = self.create_user(login_id, name, password)
        
        # 관리자 권한을 부여
        user.is_staff = True
        user.is_superuser = True
        user.role = 'ADMIN'
        
        user.save(using=self._db)
        return user

class User(AbstractBaseUser, PermissionsMixin, BaseModel):
    """
    tm_agents 테이블 대체
    BaseModel을 상속받아 created_at, updated_at, is_deleted 자동 포함
    """
    class Role(models.TextChoices):
        AGENT = 'AGENT', '상담원'
        LEADER = 'LEADER', '팀장'
        ADMIN = 'ADMIN', '관리자'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    login_id = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=50)
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.AGENT)
    
    # 상담원 전용 필드
    daily_cap = models.IntegerField(default=50)
    assigned_phone = models.CharField(max_length=20, null=True, blank=True)
    
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = 'login_id'
    REQUIRED_FIELDS = ['name']

    class Meta:
        db_table = 'users' # 깔끔하게 users로 통일