# apps/users/models.py
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from apps.common.models import BaseModel


class UserManager(BaseUserManager):
    """
    User 모델을 위한 커스텀 매니저
    """
    def create_user(self, login_id, name, password=None, **extra_fields):
        if not login_id:
            raise ValueError('로그인 ID는 필수 항목입니다.')
        
        user = self.model(
            login_id=login_id,
            name=name,
            **extra_fields
        )
        user.set_password(password) # 비밀번호 암호화 저장
        user.save(using=self._db)
        return user

    def create_superuser(self, login_id, name, password=None, **extra_fields):
        """
        createsuperuser 커맨드로 실행할 때 호출됨
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'ADMIN') # 관리자 권한 부여

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(login_id, name, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin, BaseModel):
    class Role(models.TextChoices):
        ADMIN = 'ADMIN', '총괄관리자'
        MANAGER = 'MANAGER', '팀장'
        AGENT = 'AGENT', '상담원'

    # [인증 정보] - 누구나 가진 정보
    login_id = models.CharField(max_length=50, unique=True, verbose_name="로그인ID")
    name = models.CharField(max_length=20, verbose_name="이름")
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.AGENT, verbose_name="권한")
    
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False) # 장고 Admin 접속 권한

    objects = UserManager()
    
    USERNAME_FIELD = 'login_id'
    REQUIRED_FIELDS = ['name']

    class Meta:
        db_table = 'users'

    def __str__(self):
        return f"{self.name}({self.get_role_display()})"


class AgentProfile(BaseModel):
    # [업무 정보] - 상담원만 가진 정보 (User와 1:1 연결)
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        related_name='agent_profile', 
        verbose_name="상담원 계정"
    )
    
    team_name = models.CharField(max_length=50, blank=True, verbose_name="소속팀")
    extension_number = models.CharField(max_length=10, blank=True, verbose_name="내선번호")
    daily_cap = models.IntegerField(default=50, verbose_name="일일 할당량")
    total_assigned = models.IntegerField(default=0, verbose_name="누적 할당건수")
    
    class Meta:
        db_table = 'agent_profiles'

    def __str__(self):
        return f"{self.user.name}의 프로필"