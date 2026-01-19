# apps/users/serializers.py

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers
from .models import User

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    JWT 토큰 발급 시, 유저 정보(이름, 역할 등)를 payload에 포함하거나
    Response Body에 추가 정보를 내려주기 위한 커스텀 시리얼라이저
    """
    @classmethod
    def get_token(cls, user):
        # 1. 기본 토큰 생성
        token = super().get_token(user)

        # 2. 토큰 내부(Payload)에 정보 추가 (선택사항)
        token['login_id'] = user.login_id
        token['role'] = user.role
        return token

    def validate(self, attrs):
        # 3. 로그인 성공 시 리턴되는 JSON 데이터 커스텀
        data = super().validate(attrs)
        
        # API 명세서에 맞게 응답 데이터 추가
        data['agent'] = {
            'agentId': str(self.user.id),
            'name': self.user.name,
            'role': self.user.role,
            'dailyCap': self.user.daily_cap,
            'assignedPhone': self.user.assigned_phone
        }
        return data