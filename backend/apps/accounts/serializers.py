from rest_framework import serializers
from .models import Account, MemberLevel
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

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
        fields = ['account_id', 'email', 'level', 'level_name', 'is_active', 'last_login_at', 'created_at']

# 3. 계정 생성용 (POST)
class AccountCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = Account
        fields = ['email', 'password', 'level']

    def create(self, validated_data):
        password = validated_data.pop('password')
        # 일반 create 대신 create_user를 써야 비밀번호가 암호화됨
        user = Account.objects.create_user(password=password, **validated_data)
        return user

# 4. JWT 토큰 커스텀 (로그인 시 레벨 정보 포함)
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['email'] = user.email
        token['level'] = user.level.level_name # 토큰에 등급 정보 박아넣기
        return token