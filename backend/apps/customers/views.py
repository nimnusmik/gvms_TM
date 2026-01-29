import os
import pandas as pd
from django.conf import settings
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from rest_framework import viewsets, status, parsers
from rest_framework.decorators import action
from rest_framework.response import Response

# 모델 & 시리얼라이저
from .models import Customer
from .serializers import CustomerSerializer

# Celery Task (경로가 다르면 수정 필요, 같은 앱 내 tasks.py라면 .tasks)
from .tasks import process_excel_upload

class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()     
    serializer_class = CustomerSerializer
    

    def get_queryset(self):
        # 1. 기본: 최신순 조회
        queryset = Customer.objects.all().order_by('-created_at')
        
        # 2. URL 파라미터 가져오기
        status_param = self.request.query_params.get('status')
        agent_param = self.request.query_params.get('assigned_agent')
        
        # 3. 디버깅용 로그 (터미널에서 확인 가능)
        print(f"👉 [DEBUG] 필터 요청: status={status_param}, agent={agent_param}")

        # 4. 상태 필터 적용
        if status_param and status_param != 'ALL':
            queryset = queryset.filter(status=status_param)
            
        # 5. 담당자 필터 적용
        if agent_param and agent_param != 'ALL':
            queryset = queryset.filter(assigned_agent_id=agent_param)

        return queryset

    # 🚀 [핵심 2] Celery 비동기 업로드 (기존 기능 유지)
    @action(detail=False, methods=['POST'])
    def upload_excel(self, request):
        file = request.FILES.get('file')
        if not file:
             return Response({"error": "파일이 없습니다."}, status=400)

        # 임시 저장
        path = default_storage.save(f"temp/{file.name}", ContentFile(file.read()))
        full_path = os.path.join(settings.MEDIA_ROOT, path)

        # 비동기 작업 시작
        task = process_excel_upload.delay(full_path)

        return Response({
            "message": "✅ 대용량 업로드가 시작되었습니다. (잠시 후 새로고침 해주세요)",
            "task_id": task.id
        }, status=status.HTTP_202_ACCEPTED)