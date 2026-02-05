import os

import pandas as pd
from rest_framework import viewsets, status, parsers, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db import transaction
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone 
from django.shortcuts import get_object_or_404
from django.core.files.storage import default_storage 
from django.core.files.base import ContentFile
from django.conf import settings

from .models import Customer
from .serializers import CustomerSerializer
from .tasks import task_run_auto_assign
from apps.agents.models import Agent

# 상수 정의
REQUIRED_COLUMNS = ['이름', '전화번호', '관심분야']
TEAM_MAPPING = {
    '배터리': Customer.Team.BATTERY,
    '모빌리티': Customer.Team.MOBILITY,
    '태양광': Customer.Team.SOLAR,
    '산업기계': Customer.Team.MACHINE,
    '산업 기계': Customer.Team.MACHINE,
}
EXCEL_HEADER_ROW_OFFSET = 2  # 엑셀 헤더(1행) + 0-based index 보정
MAX_ERROR_REPORTS = 5


# 1. 엑셀 업로드 전용 뷰 (분리)
class CustomerUploadView(APIView):
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def post(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response({"error": "파일이 없습니다."}, status=400)

        try:
            df = self._read_excel_file(file)
            self._validate_columns(df)
            
            created_count, errors = self._process_customers(df)
            
            return Response({
                "message": f"✅ {created_count}건 업로드 성공!",
                "errors": errors[:MAX_ERROR_REPORTS]
            }, status=201)

        except ValueError as e:
            return Response({"error": str(e)}, status=400)
        except Exception as e:
            return Response({"error": f"파일 처리 중 오류: {str(e)}"}, status=500)

    def _read_excel_file(self, file):
        """엑셀 파일을 읽고 NaN 값을 None으로 변환"""
        df = pd.read_excel(file)
        return df.where(pd.notnull(df), None)

    def _validate_columns(self, df):
        """필수 컬럼 존재 여부 검증"""
        missing_columns = [col for col in REQUIRED_COLUMNS if col not in df.columns]
        if missing_columns:
            raise ValueError(f"필수 컬럼 누락: {missing_columns}")

    def _process_customers(self, df):
        """고객 데이터 처리 및 DB 저장"""
        created_count = 0
        errors = []

        with transaction.atomic():
            for index, row in df.iterrows():
                try:
                    customer_data = self._extract_customer_data(row)
                    if not customer_data:
                        continue
                    
                    if self._is_duplicate_phone(customer_data['phone']):
                        continue
                    
                    self._create_customer(customer_data)
                    created_count += 1
                    
                except Exception as e:
                    row_number = index + EXCEL_HEADER_ROW_OFFSET
                    errors.append(f"{row_number}행 에러: {str(e)}")

        return created_count, errors

    def _extract_customer_data(self, row):
        """행 데이터에서 고객 정보 추출"""
        name = str(row['이름']).strip() if row['이름'] else None
        raw_phone = str(row['전화번호']) if row['전화번호'] else ""
        phone = raw_phone.replace('-', '').strip()
        team_kor = str(row['관심분야']).strip() if row['관심분야'] else ""
        
        if not phone:
            return None
        
        team_code = TEAM_MAPPING.get(team_kor)
        
        return {
            'name': name,
            'phone': phone,
            'team': team_code,
        }

    def _is_duplicate_phone(self, phone):
        """전화번호 중복 체크"""
        return Customer.objects.filter(phone=phone).exists()

    def _create_customer(self, customer_data):
        """고객 레코드 생성"""
        Customer.objects.create(
            name=customer_data['name'],
            phone=customer_data['phone'],
            team=customer_data['team'],
            status=Customer.Status.NEW
        )


class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.select_related('assigned_agent').all().order_by('-created_at')
    serializer_class = CustomerSerializer
    
    # ✅ 필터 설정 (이것만 있으면 됩니다!)
    filter_backends = [
        DjangoFilterBackend,   # 정확한 값 일치 (status='NEW')
        filters.SearchFilter,  # 검색어 포함 (search='홍길동')
        filters.OrderingFilter # 정렬 (ordering='-created_at')
    ]
    
    # 1. 정확히 일치해야 하는 필드들
    filterset_fields = ['status', 'team', 'assigned_agent'] 
    
    # 2. 검색어가 포함되어야 하는 필드들
    search_fields = ['name', 'phone', 'memo', 'region', 'team'] 
    
    # 3. 정렬 가능 필드
    ordering_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']

    # 👇 [수정] 수동 로직 다 지우고, 딱 이것만 남기세요!
    def get_queryset(self):
        # super()를 호출해야 위에서 설정한 select_related 최적화가 유지됩니다.
        return super().get_queryset()
    
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

    @action(detail=False, methods=['post'], url_path='bulk-unassign')
    def bulk_unassign(self, request):
        ids = request.data.get('ids', [])
        if not ids:
            return Response({"error": "선택된 고객이 없습니다."}, status=400)

        with transaction.atomic():
            # 1. 해당 고객들의 담당자를 None으로, 상태를 다시 'NEW'로 변경
            updated_count = Customer.objects.filter(id__in=ids).update(
                assigned_agent=None,
                status='NEW' # 배정이 취소되었으니 '접수(신규)' 상태로 복구
            )
            
        return Response({
            "message": f"✅ {updated_count}명의 배정이 취소되었습니다."
        })


    @action(detail=False, methods=['post'], url_path='run-daily-assign')
    def run_daily_assign(self, request):
        from .services import run_auto_assign_logic
        """
        [관리자용] 자동 배정 수동 실행 버튼
        """
        # 실행자 이름 확보
        trigger_user = request.user.name if hasattr(request.user, 'name') else request.user.username
        
        # Celery Task 비동기 호출 (.delay)
        task_run_auto_assign.delay(triggered_by=trigger_user)

        return Response({
            'message': '자동 배정 작업이 시작되었습니다.',
            'info': '결과는 [자동 배정 이력] 메뉴에서 잠시 후 확인 가능합니다.'
        }, status=202)

    # ----------------------------------------------------------------
    # 🌟 기능: 고객 DB 초기화 (전체 삭제)
    # ----------------------------------------------------------------
    @action(detail=False, methods=['delete'], url_path='reset-db')
    def reset_db(self, request):
        """
        [관리자용] 고객 DB 전체 삭제
        """
        with transaction.atomic():
            deleted_count, _ = Customer.objects.all().delete()

        return Response({
            "message": f"✅ 고객 DB {deleted_count}건이 삭제되었습니다.",
            "deleted_count": deleted_count
        }, status=status.HTTP_200_OK)
