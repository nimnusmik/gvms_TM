from rest_framework import serializers
from .models import CallLog

class CallLogSerializer(serializers.ModelSerializer):
    agent_name = serializers.ReadOnlyField(source='agent.user.name')
    customer_name = serializers.ReadOnlyField(source='customer.name')

    class Meta:
        model = CallLog
        fields = [
            'id',
            'assignment',      # 어느 배정 건인지
            'agent', 'agent_name',
            'customer', 'customer_name',
            'call_type',
            'result',          # 통화 결과
            'recipient_name',  # 수신자명  
            'recipient_email', # 이메일
            'recipient_mobile',# 휴대폰
            'sentiment',       # 감도
            'item_interested', # 관심 아이템
            'memo',
            'duration',
            'recording_file',
            'status_before',   # 자동 기록됨
            'status_after',    # 자동 기록됨
            'created_at',
        ]
        read_only_fields = ['agent', 'status_before', 'status_after', 'created_at']