from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers
from .models import User

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # 토큰 자체에 박제할 정보
        token['name'] = user.name
        token['role'] = user.role
        return token

    def validate(self, attrs):
        data = super().validate(attrs)

        # 응답 데이터 구성
        data['name'] = self.user.name
        data['role'] = self.user.role
        data['dailyCap'] = 0 
        data['team'] = ""

        # 1. 상담원(AGENT)인 경우 -> AgentProfile에서 정보 가져오기
        if self.user.role == User.Role.AGENT:
            if hasattr(self.user, 'agent_profile'):
                data['dailyCap'] = self.user.agent_profile.daily_cap
                data['team'] = self.user.agent_profile.team_name
                data['extension'] = self.user.agent_profile.extension_number

        # 2. 관리자(MANAGER)인 경우
        elif self.user.role == User.Role.MANAGER:
            if hasattr(self.user, 'manager_profile'):
                data['team'] = self.user.manager_profile.department
                data['rank'] = self.user.manager_profile.rank

        return data

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'login_id', 'name', 'role']