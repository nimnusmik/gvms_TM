# apps/customers/views.py

import os
from rest_framework import viewsets, status, parsers, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db import transaction
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone 
from django.shortcuts import get_object_or_404
from django.core.files.storage import default_storage 
from django.conf import settings

from .models import Customer
from .serializers import CustomerSerializer
from apps.agents.models import Agent

# ✅ Celery Task Import
from .tasks import task_run_auto_assign, task_process_large_excel

# ----------------------------------------------------------------
# 1. [수정됨] 엑셀 업로드 뷰 (비동기 방식)
# ----------------------------------------------------------------
class CustomerUploadView(APIView):
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def post(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response({"error": "파일이 없습니다."}, status=400)

        try:
            # 1. 파일을 임시 폴더(media/temp)에 저장
            timestamp = timezone.now().strftime('%Y%m%d%H%M%S')
            file_name = f"upload_{timestamp}_{file.name}"
            
            # default_storage.save는 저장된 경로를 반환합니다.
            saved_path = default_storage.save(f"temp/{file_name}", file)
            
            # 2. 전체 시스템 경로(Full Path) 확보
            full_path = os.path.join(settings.MEDIA_ROOT, saved_path)

            # 3. Celery Task 호출 (즉시 리턴)
            user_id = request.user.pk if request.user.is_authenticated else None
            
            # .delay()를 쓰면 백그라운드에서 실행됩니다.
            task_process_large_excel.delay(file_path=full_path, user_id=user_id)

            return Response({
                "message": "✅ 대용량 파일 업로드가 시작되었습니다.",
                "detail": "데이터 처리량이 많아 백그라운드에서 진행됩니다. 잠시 후 새로고침 해주세요.",
                "file_name": file.name
            }, status=202)

        except Exception as e:
            return Response({"error": f"파일 업로드 처리 중 오류: {str(e)}"}, status=500)


# ----------------------------------------------------------------
# 2. 고객 관리 ViewSet (기존 기능 100% 유지)
# ----------------------------------------------------------------
class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.select_related('assigned_agent').all().order_by('-created_at')
    serializer_class = CustomerSerializer
    
    # 필터 설정
    filter_backends = [
        DjangoFilterBackend,   
        filters.SearchFilter,  
        filters.OrderingFilter 
    ]
    
    filterset_fields = ['status', 'assigned_agent'] 
    
    # ✅ 검색 필드에 새로운 컬럼(분야, 지역) 추가
    search_fields = [
        'name', 'phone', 'memo', 'region',
        'category_1', 'category_2', 'category_3', 
        'region'
    ] 
    
    ordering_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']

    def get_queryset(self):
        return super().get_queryset()
    
    # ----------------------------------------------------------------
    # 기능: 고객 대량 배정 (Bulk Assign)
    # ----------------------------------------------------------------
    @action(detail=False, methods=['post'], url_path='bulk-assign')
    def bulk_assign(self, request):
        target_ids = request.data.get('ids', [])      
        target_agent_id = request.data.get('agent_id') 

        if not target_ids:
            return Response({"detail": "배정할 고객을 선택해주세요."}, status=status.HTTP_400_BAD_REQUEST)
        
        if not target_agent_id:
            return Response({"detail": "배정할 상담원을 선택해주세요."}, status=status.HTTP_400_BAD_REQUEST)

        agent = get_object_or_404(Agent, pk=target_agent_id)

        # Bulk Update
        updated_count = self.get_queryset().filter(id__in=target_ids).update(
            assigned_agent=agent,     
            status='ASSIGNED',     
            updated_at=timezone.now() 
        )

        return Response({
            "message": f"성공적으로 {updated_count}명의 고객을 {agent.user.name}님에게 배정했습니다.",
            "updated_count": updated_count
        })

    # ----------------------------------------------------------------
    # 기능: 배정 취소 (Bulk Unassign)
    # ----------------------------------------------------------------
    @action(detail=False, methods=['post'], url_path='bulk-unassign')
    def bulk_unassign(self, request):
        ids = request.data.get('ids', [])
        if not ids:
            return Response({"error": "선택된 고객이 없습니다."}, status=400)

        with transaction.atomic():
            updated_count = Customer.objects.filter(id__in=ids).update(
                assigned_agent=None,
                status='NEW' 
            )
            
        return Response({
            "message": f"✅ {updated_count}명의 배정이 취소되었습니다."
        })


    # ----------------------------------------------------------------
    # 기능: 자동 배정 수동 실행
    # ----------------------------------------------------------------
    @action(detail=False, methods=['post'], url_path='run-daily-assign')
    def run_daily_assign(self, request):
        # 실행자 정보 확보
        trigger_user = request.user.name if hasattr(request.user, 'name') else request.user.username
        
        # Celery Task 비동기 호출
        task_run_auto_assign.delay(triggered_by=trigger_user)

        return Response({
            'message': '자동 배정 작업이 시작되었습니다.',
            'info': '결과는 [자동 배정 이력] 메뉴에서 잠시 후 확인 가능합니다.'
        }, status=202)

    # ----------------------------------------------------------------
    # 기능: DB 초기화
    # ----------------------------------------------------------------
    @action(detail=False, methods=['delete'], url_path='reset-db')
    def reset_db(self, request):
        with transaction.atomic():
            deleted_count, _ = Customer.objects.all().delete()

        return Response({
            "message": f"✅ 고객 DB {deleted_count}건이 삭제되었습니다.",
            "deleted_count": deleted_count
        }, status=status.HTTP_200_OK)
