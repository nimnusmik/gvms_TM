from rest_framework import serializers
from .models import SalesAssignment, CallLog
from apps.customers.serializers import CustomerSerializer
from apps.agents.models import Agent

# [1] 영업 배정 정보 (메인)
class SalesAssignmentSerializer(serializers.ModelSerializer):
    # 🔥 핵심: 배정 정보 안에 '고객 정보'를 통째로 넣어줌 (읽기 전용)
    customer = CustomerSerializer(read_only=True)
    agent = serializers.PrimaryKeyRelatedField(
        queryset=Agent.objects.all(),
        required=False,
        allow_null=True,
        write_only=True
    )
    agent_id = serializers.SerializerMethodField()
    agent_name = serializers.SerializerMethodField()
    agent_code = serializers.SerializerMethodField()

    # 1차/2차 구분, 상태 등은 사람이 읽기 좋은 글자(Label)로도 변환 가능
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    stage_display = serializers.CharField(source='get_stage_display', read_only=True)
    call_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = SalesAssignment
        fields = [
            'id', 
            'stage', 'stage_display', 
            'status', 'status_display',
            'sentiment',      # 고객 감도 (상/중/하)
            'item_interested',# 관심 아이템
            'memo',           # 상담 메모
            'customer',       # 👈 여기에 이름, 전화번호 다 들어있음!
            'agent',          # write-only
            'agent_id',
            'agent_name',
            'agent_code',
            'call_count',
            'assigned_at', 
            'updated_at'
        ]
        read_only_fields = ['stage', 'assigned_at', 'updated_at']

    def get_agent_id(self, obj):
        return str(obj.agent.agent_id) if obj.agent else None

    def get_agent_name(self, obj):
        return obj.agent.user.name if obj.agent and obj.agent.user else None

    def get_agent_code(self, obj):
        return obj.agent.code if obj.agent else None

# [2] 통화 기록 (정산용)
class CallLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = CallLog
        fields = '__all__'
