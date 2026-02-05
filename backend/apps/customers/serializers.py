from rest_framework import serializers
from .models import Customer

# 1. 기본 고객 정보용
class CustomerSerializer(serializers.ModelSerializer):
    agent_name = serializers.CharField(
        source='assigned_agent.user.name', 
        read_only=True, 
        default='-'
    )

    team_display = serializers.CharField(source='get_team_display', read_only=True)
    
    # 전화 횟수 (상담 이력 개수 카운트) - 추후 상담 이력 모델이 생기면 활성화
    # call_count = serializers.SerializerMethodField()
    
    # def get_call_count(self, obj):
    #     # 상담 이력 모델의 related_name에 따라 수정 필요
    #     # 예: return obj.consultation_set.count() if hasattr(obj, 'consultation_set') else 0
    #     return 0

    class Meta:
        model = Customer
        fields = [
            'id', 'name', 'phone', 'status', 'assigned_agent', 'agent_name', 
            'created_at', 'team', 'team_display',
            # 신규 필드 추가
            'category_1', 'category_2', 'category_3',
            'region_1', 'region_2', 'region',
            # 'call_count',  # 추후 활성화
        ]
        
# 2. 엑셀 파일 업로드용 (DB 저장용이 아니라 입력 검증용)
class FileUploadSerializer(serializers.Serializer):
    file = serializers.FileField()