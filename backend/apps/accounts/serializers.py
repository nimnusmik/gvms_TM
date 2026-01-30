from rest_framework import serializers
from .models import Account, MemberLevel
from apps.agents.models import Agent
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from django.db import transaction

User = get_user_model()

# 1. 등급 조회용
class LevelSerializer(serializers.ModelSerializer):
    class Meta:
        model = MemberLevel
        fields = ['level_id', 'level_name']

# 2. 계정 조회용 (GET)
class AccountSerializer(serializers.ModelSerializer):
    level_name = serializers.CharField(source='level.level_name', read_only=True) # 레벨 이름 바로 보여주기

    class Meta:
        model = Account
        fields = ['account_id', 'email', 'name', 'level', 'level_name', 'is_active','is_staff', 'last_login_at', 'created_at']

# 3. 계정 생성용 (POST)
class AccountCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = Account
        fields = ['email', 'password', 'name', 'level']

    def create(self, validated_data):

        user = Account.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            name=validated_data['name'],  
        )
        return user


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    
    # 1. Account 모델에는 없지만, 입력은 받아야 하는 필드 추가
    phone_number = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = Account
        # 2. fields에 phone_number 추가
        fields = ['email', 'password', 'name', 'phone_number'] 

    def create(self, validated_data):
        
        default_level = MemberLevel.objects.first()
        if not default_level: 
            default_level = MemberLevel.objects.create(level_name="일반사원")

        user = Account.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            name=validated_data['name'],
            phone_number=validated_data.get('phone_number', ''), # ✨ 전화번호 저장
            level=default_level
        )
        
        return user


# 4. JWT 토큰 커스텀 (로그인 시 레벨 정보 포함)
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # 토큰 안에 정보 넣기 (이건 암호화되어 날아감)
        token['is_staff'] = user.is_staff
        token['name'] = user.name       
        token['email'] = user.email
        token['level'] = user.level.level_name if user.level else "Unknown"
        return token

    def validate(self, attrs):
        # 1. 기본 로그인 수행 (access, refresh 토큰 생성)
        data = super().validate(attrs)

        # 2. 🌟 [수정] 프론트엔드 AuthResponse 타입에 맞춰서 'user' 객체 구성
        user_data = {
            "account_id": self.user.account_id,
            "email": self.user.email,
            "name": self.user.name,
            "is_staff": self.user.is_staff,
            "level": {
                "level_id": self.user.level.level_id if self.user.level else 0,
                "level_name": self.user.level.level_name if self.user.level else "Unknown"
            }
        }

        # 3. 응답 데이터에 포함시키기
        data['user'] = user_data        # 👈 프론트: response.data.user
        data['is_staff'] = self.user.is_staff # 👈 프론트: response.data.is_staff (편의상 밖에도 하나 둠)

        return data