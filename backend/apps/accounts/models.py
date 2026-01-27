import uuid 
import random
import string
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin

# 1. 등급 테이블 (member_levels)
class MemberLevel(models.Model):
    level_id = models.AutoField(primary_key=True)
    level_name = models.CharField("등급명", max_length=50, unique=True)

    class Meta:
        db_table = 'member_levels' # DB 테이블 이름 지정
        verbose_name = '회원 등급'

    def __str__(self):
        return self.level_name


# 2. 커스텀 유저 매니저 (유저 생성 로직)
class AccountManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('이메일은 필수입니다.')
        
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password) # 비밀번호 해싱 (암호화)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        # 슈퍼유저 생성 시 'admin' 레벨이 없으면 자동 생성
        admin_level, _ = MemberLevel.objects.get_or_create(level_name='admin')
        
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('level', admin_level) # 관리자 레벨 자동 할당

        return self.create_user(email, password, **extra_fields)


# 3. 계정 테이블 (accounts)
class Account(AbstractBaseUser, PermissionsMixin):
    account_id = models.BigAutoField(primary_key=True)
    email = models.EmailField("이메일", max_length=100, unique=True)

    name = models.CharField("이름", max_length=20)
    
    # FK 연결: accounts.level_id -> member_levels.level_id
    level = models.ForeignKey(MemberLevel, on_delete=models.PROTECT, related_name='accounts', verbose_name="등급")
    
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False) # 장고 어드민 접속 권한
    
    last_login_at = models.DateTimeField(auto_now=True) # 로그인 할 때마다 자동 갱신
    created_at = models.DateTimeField(auto_now_add=True) # 생성 시 자동 입력

    # Django 필수 설정
    objects = AccountManager()
    USERNAME_FIELD = 'email' # 로그인 ID로 이메일 사용
    REQUIRED_FIELDS = ['name']     

    class Meta:
        db_table = 'accounts' # DB 테이블 이름 지정
        verbose_name = '계정'

    def __str__(self):
        return f"{self.email} ({self.level.level_name})"