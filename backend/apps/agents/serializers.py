from rest_framework import serializers
from .models import Agent
from django.contrib.auth import get_user_model

User = get_user_model()

# 1. 관리자용: 상담원 생성/수정 (모든 권한)
class AgentAdminSerializer(serializers.ModelSerializer):
    account_id = serializers.IntegerField(write_only=True)
    
    # 프론트에 'name'과 'email'을 보여주기 위해 User에서 가져옵니다.
    name = serializers.CharField(source='user.name', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True) 
    
    # 사번
    code = serializers.CharField(read_only=True)
    
    class Meta:
        model = Agent
        fields = '__all__'
        # user 필드는 create에서 우리가 넣어주니 읽기 전용으로 뺍니다.
        read_only_fields = ['code', 'created_at', 'user']

    def create(self, validated_data):
        account_id = validated_data.pop('account_id')

        try:
            user = User.objects.get(pk=account_id)
        except User.DoesNotExist:
            raise serializers.ValidationError({"account_id": "존재하지 않는 직원입니다."})

        if hasattr(user, 'agent_profile'):
             raise serializers.ValidationError({"account_id": "이미 등록된 상담원입니다."})

        # ✨ [수정 2] Agent 모델에서 name을 지웠으니, 저장할 때도 name=...을 빼야 합니다!
        # (user=user만 연결하면 이름은 알아서 따라옵니다)
        agent = Agent.objects.create(user=user, **validated_data)
        
        return agent


# 2. 드롭다운용: 간단한 유저 정보 (후보자 목록)
class AccountSimpleSerializer(serializers.ModelSerializer):
    id = serializers.ReadOnlyField(source='account_id')

    class Meta:
        model = User
        fields = ['id', 'email', 'name']


# 3. 일반용/대시보드용: 내 정보 조회
class AgentSerializer(serializers.ModelSerializer):
    account_id = serializers.PrimaryKeyRelatedField(
        source='user',
        queryset=User.objects.all(),
        write_only=True
    )

    # ✨ [수정 3] 여기도 똑같이 User에서 가져오라고 명시해야 프론트에서 보입니다.
    name = serializers.CharField(source='user.name', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = Agent
        fields = [
            'agent_id', 
            'account_id', 
            'name',       # 👈 위에서 정의했으니 이제 나옵니다!
            'email',      
            'team', 
            'assigned_phone', # ⚠️ 모델 필드명이 assigned_phone이라면 여기도 맞춰야 합니다 (extension_number X)
            'status', 
            'daily_cap', 
            'is_auto_assign', 
            'created_at',
            'code'
        ]
        read_only_fields = ['agent_id', 'created_at', 'code']