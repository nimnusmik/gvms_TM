from rest_framework import serializers
from .models import Settlement


class SettlementRowSerializer(serializers.ModelSerializer):
    agent_id = serializers.UUIDField(source='agent.agent_id', read_only=True)
    agent_name = serializers.CharField(source='agent.user.name', read_only=True)
    team = serializers.CharField(source='agent.team', read_only=True)
    billable_count = serializers.SerializerMethodField()
    status_label = serializers.CharField(source='get_status_display', read_only=True)
    final_amount = serializers.SerializerMethodField()

    class Meta:
        model = Settlement
        fields = [
            'id',
            'agent_id',
            'agent_name',
            'team',
            'success_count',
            'reject_count',
            'invalid_count',
            'absence_count',
            'billable_count',
            'calculated_amount',
            'final_amount',
            'status',
            'status_label',
            'note',
        ]

    def get_billable_count(self, obj):
        return obj.success_count + obj.reject_count + obj.invalid_count + obj.absence_count

    def get_final_amount(self, obj):
        return obj.final_amount if obj.final_amount is not None else obj.calculated_amount


class SettlementUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Settlement
        fields = ['status', 'note', 'final_amount']

    def validate_final_amount(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError('정산 금액은 0 이상이어야 합니다.')
        return value
