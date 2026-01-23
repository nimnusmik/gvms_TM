from rest_framework import serializers
from .models import Account, MemberLevel
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model

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

    class Meta:
        model = Account
        # 👇 중요: 'level', 'is_staff', 'is_active' 같은 건 입력 못하게 뺍니다!
        fields = ['email', 'password', 'name'] 

    def create(self, validated_data):

        default_level = MemberLevel.objects.first()
        
        if not default_level: MemberLevel.objects.create(level_name="일반사원")

        user = Account.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            name=validated_data['name'],
            level=default_level
        )
        return user


# 4. JWT 토큰 커스텀 (로그인 시 레벨 정보 포함)
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        token['is_staff'] = user.is_staff
        token['name'] = user.name       
        token['email'] = user.email
        token['level'] = user.level.level_name if user.level else "Unknown"
        return token

    def validate(self, attrs):
        # 1. 부모님(super) 기술로 먼저 검증하고 토큰을 받아옵니다.
        data = super().validate(attrs)

        # 2. 받아온 데이터 가방(data)에 'is_staff'를 몰래 집어넣습니다.
        data['is_staff'] = self.user.is_staff
        # data['email'] = self.user.email # 필요하면 이메일도 추가

        return data
    