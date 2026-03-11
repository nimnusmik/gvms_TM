from rest_framework import serializers
from .models import CallLog


class CallLogSerializer(serializers.ModelSerializer):
    agent_name = serializers.ReadOnlyField(source="agent.user.name")
    customer_id = serializers.ReadOnlyField(source="assignment.customer.id")
    customer_name = serializers.ReadOnlyField(source="assignment.customer.name")
    customer_phone = serializers.ReadOnlyField(source="assignment.customer.phone")

    result = serializers.ChoiceField(source="result_type", choices=CallLog.Result.choices)
    duration = serializers.IntegerField(source="call_duration", required=False)

    class Meta:
        model = CallLog
        fields = [
            "id",
            "assignment",
            "agent",
            "agent_name",
            "customer_id",
            "customer_name",
            "customer_phone",
            "call_start",
            "duration",
            "result",
            "memo",
            "callback_scheduled_at",
            "status_before",
            "status_after",
            "recording_file",
            "recording_status",
            "recording_mime",
            "recording_size",
            "recording_uploaded_at",
        ]
        read_only_fields = [
            "agent",
            "status_before",
            "status_after",
            "recording_status",
            "recording_mime",
            "recording_size",
            "recording_uploaded_at",
        ]
