from rest_framework import serializers
from .models import Customer

# 1. 기본 고객 정보용
class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = '__all__'

# 2. 엑셀 파일 업로드용 (DB 저장용이 아니라 입력 검증용)
class FileUploadSerializer(serializers.Serializer):
    file = serializers.FileField()