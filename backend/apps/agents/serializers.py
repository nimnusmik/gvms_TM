from django.db import transaction
from rest_framework import serializers
from .models import Agent
from django.contrib.auth import get_user_model

User = get_user_model()

# 1. 관리자용: 상담원 생성/수정 (모든 권한)
class AgentAdminSerializer(serializers.ModelSerializer):
    account_id = serializers.IntegerField(write_only=True)
    
    code = serializers.CharField(read_only=True)
    email = serializers.EmailField(source='account.email', read_only=True)
    
    class Meta:
        model = Agent
        fields = '__all__'
        read_only_fields = ['code', 'created_at', 'user', 'name']

    
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
        agent = Agent.objects.create(user=user, name=user.name, **validated_data)
        
        return agent

# 2. 드롭다운용: 간단한 유저 정보 (후보자 목록)
class AccountSimpleSerializer(serializers.ModelSerializer):
    id = serializers.ReadOnlyField(source='account_id')

    class Meta:
        model = User
        fields = ['id', 'email', 'name']

# 3. 일반용/대시보드용: 내 정보 조회 (읽기 전용 위주)
class AgentSerializer(serializers.ModelSerializer):
    # ✨ [핵심] 프론트에서 'account_id'를 보내면 -> 모델의 'user' 필드에 저장한다!
    account_id = serializers.PrimaryKeyRelatedField(
        source='user',          # DB에는 user 컬럼에 저장
        queryset=User.objects.all(),
        write_only=True         # 입력받을 때만 사용
    )

    # 조회할 때 보여줄 정보 (선택사항)
    name = serializers.CharField(source='user.name', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = Agent
        fields = [
            'agent_id', 
            'account_id', # 👈 입력 필드 (필수)
            'name',       # 조회용
            'email',      # 조회용
            'team', 
            'extension_number', 
            'status', 
            'daily_cap', 
            'is_auto_assign', 
            'created_at'
        ]
        read_only_fields = ['agent_id', 'created_at', 'code']