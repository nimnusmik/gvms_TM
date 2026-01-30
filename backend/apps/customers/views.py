import os
import pandas as pd
from django.conf import settings
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from rest_framework import viewsets, status, parsers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import filters
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone 
from django.shortcuts import get_object_or_404

# 모델 & 시리얼라이저
from .models import Customer
from .serializers import CustomerSerializer
from apps.agents.models import Agent

# Celery Task (경로가 다르면 수정 필요, 같은 앱 내 tasks.py라면 .tasks)
from .tasks import process_excel_upload

class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.select_related('assigned_agent').all().order_by('-created_at')
    serializer_class = CustomerSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    
    filter_backends = [
        DjangoFilterBackend, # ?status=NEW 처리는 얘가 함
        filters.SearchFilter, # ?search=홍길동 처리는 얘가 함
        filters.OrderingFilter # 정렬 기능
    ]
    

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
    # ----------------------------------------------------------------
    # 🚀 [핵심 2] Celery 비동기 업로드 (기존 기능 유지)
    # ----------------------------------------------------------------

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

    
    # ----------------------------------------------------------------
    # 🌟 기능: 고객 대량 배정 (Bulk Assign)
    # ----------------------------------------------------------------
    @action(detail=False, methods=['post'], url_path='bulk-assign')
    def bulk_assign(self, request):
        # 1. [입력] 프론트엔드에서 보낸 데이터 받기
        target_ids = request.data.get('ids', [])      
        target_agent_id = request.data.get('agent_id') 

        # 2. [검증]
        if not target_ids:
            return Response({"detail": "배정할 고객을 선택해주세요."}, status=status.HTTP_400_BAD_REQUEST)
        
        if not target_agent_id:
            return Response({"detail": "배정할 상담원을 선택해주세요."}, status=status.HTTP_400_BAD_REQUEST)

        # 3. [조회] 상담원 객체 가져오기
        agent = get_object_or_404(Agent, pk=target_agent_id)

        # 4. [실행] 쿼리 한 방으로 업데이트 (Bulk Update) ⚡️
        updated_count = self.get_queryset().filter(id__in=target_ids).update(
            assigned_agent=agent,     # 👈 [수정됨] 모델의 필드명(assigned_agent)과 일치해야 합니다!
            status='ASSIGNED',     
            updated_at=timezone.now() 
        )

        # 5. [응답]
        return Response({
            "message": f"성공적으로 {updated_count}명의 고객을 {agent.user.name}님에게 배정했습니다.",
            "updated_count": updated_count
        })