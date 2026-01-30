from rest_framework import serializers
from .models import Customer

# 1. 기본 고객 정보용
class CustomerSerializer(serializers.ModelSerializer):
    agent_name = serializers.CharField(
        source='assigned_agent.user.name', 
        read_only=True, 
        default=None
    )

    class Meta:
        model = Customer
        fields = ['id', 'name', 'phone', 'status', 'assigned_agent', 'agent_name', 'created_at']
        
# 2. 엑셀 파일 업로드용 (DB 저장용이 아니라 입력 검증용)
class FileUploadSerializer(serializers.Serializer):
    file = serializers.FileField()