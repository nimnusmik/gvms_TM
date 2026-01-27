from django.db import transaction
from rest_framework import serializers
from .models import Agent
from django.contrib.auth import get_user_model

User = get_user_model()

# 1. 관리자용: 상담원 생성/수정 (모든 권한)
class AgentAdminSerializer(serializers.ModelSerializer):
    # 입력받을 때는 ID로 받음 (User 테이블의 PK)
    account_id = serializers.IntegerField(write_only=True)
    
    code = serializers.CharField(read_only=True)
    # 보여줄 때는 이메일도 보여줌
    account_email = serializers.EmailField(source='account.email', read_only=True)

    class Meta:
        model = Agent
        fields = [
            'agent_id', 'code', 'account_id', 'account_email', 
            'name', 'assigned_phone', 'daily_cap', 
            'role', 'status', 'is_auto_assign', 'created_at'
        ]

    
    def create(self, validated_data):
        # 1. account_id(숫자)를 쏙 빼냄
        account_id = validated_data.pop('account_id')

        # 2. 숫자 -> 사람(User 객체)으로 통역
        try:
            user = User.objects.get(pk=account_id)
        except User.DoesNotExist:
            raise serializers.ValidationError({"account_id": "존재하지 않는 직원입니다."})

        # 3. 중복 체크 (이미 등록된 사람인지)
        if hasattr(user, 'agent_profile'):
             raise serializers.ValidationError({"account_id": "이미 등록된 상담원입니다."})

        # 4. 저장! (code는 모델의 save()에서 자동 생성됨)
        agent = Agent.objects.create(account=user, **validated_data)
        
        return agent



# 2. 드롭다운용: 간단한 유저 정보 (후보자 목록)
class AccountSimpleSerializer(serializers.ModelSerializer):
    id = serializers.ReadOnlyField(source='account_id')

    class Meta:
        model = User
        fields = ['id', 'email', 'name']

# 3. 일반용/대시보드용: 내 정보 조회 (읽기 전용 위주)
class AgentSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='account.email', read_only=True)

    class Meta:
        model = Agent
        fields = [
            'agent_id', 'name', 'email', 'assigned_phone', 
            'role', 'status', 'daily_cap', 'is_auto_assign'
        ]