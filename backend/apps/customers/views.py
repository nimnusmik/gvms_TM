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

# 유연한 컬럼 매핑 정의 (우선순위 순서)
# "이 컬럼들 중 하나라도 있으면 그걸 해당 필드로 쓰겠다"는 뜻

COLUMN_MAPPING = {
    'name': ['이름', '회사명', '사찰명', '상호명', '대표자', '성명'], 
    'phone': ['전화번호', '휴대폰', '연락처', 'Tel', 'Phone'],
    'category_1': ['분야1', '업종', '업태'], 
    'category_2': ['분야2', '주생산품', '종목'],
    'category_3': ['분야3'],
    'region_1': ['지역1', '시도'],
    'region_2': ['지역2', '시군구'],
}

class CustomerUploadView(APIView):
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def post(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response({"error": "파일이 없습니다."}, status=400)

        try:
            # 1. 파일 읽기 & 헤더 공백 제거 (핵심!)
            df = self._read_excel_file(file)
            
            # 2. 컬럼 검증
            self._validate_columns(df)
            
            # 3. 데이터 처리 (디버깅 정보 포함)
            result = self._process_customers(df)
            
            return Response(result, status=201)

        except ValueError as e:
            return Response({"error": str(e)}, status=400)
        except Exception as e:
            print(f"❌ 업로드 중 치명적 에러: {e}")
            return Response({"error": f"서버 에러: {str(e)}"}, status=500)

    def _read_excel_file(self, file):
        """엑셀 파일을 읽고 헤더의 앞뒤 공백을 제거함"""
        df = pd.read_excel(file)
        # 👇 [핵심] 컬럼명에 있는 공백 제거 ("전화번호 " -> "전화번호")
        df.columns = df.columns.str.strip()
        # NaN 값을 None으로 변환
        return df.where(pd.notnull(df), None)

    def _validate_columns(self, df):
        """매핑된 컬럼 중 하나라도 존재하는지 확인"""
        # 디버깅용: 현재 엑셀의 컬럼명 출력
        print(f"📂 업로드된 엑셀 컬럼: {list(df.columns)}")

        has_name = any(col in df.columns for col in COLUMN_MAPPING['name'])
        has_phone = any(col in df.columns for col in COLUMN_MAPPING['phone'])

        if not has_name:
            raise ValueError(f"이름 관련 컬럼을 찾을 수 없습니다. (확인된 컬럼: {list(df.columns)})")
        if not has_phone:
            raise ValueError(f"전화번호 관련 컬럼을 찾을 수 없습니다.")

    def _process_customers(self, df):
        created_count = 0
        skipped_count = 0
        errors = []
        skip_reasons = {} # 왜 건너뛰었는지 이유 기록

        with transaction.atomic():
            for index, row in df.iterrows():
                try:
                    # 1. 데이터 추출
                    customer_data = self._extract_customer_data(row)
                    
                    if not customer_data:
                        skipped_count += 1
                        reason = "필수데이터(이름/전화번호) 누락"
                        skip_reasons[reason] = skip_reasons.get(reason, 0) + 1
                        continue
                    
                    # 2. 중복 체크
                    if self._is_duplicate_phone(customer_data['phone']):
                        skipped_count += 1
                        reason = "이미 등록된 번호"
                        skip_reasons[reason] = skip_reasons.get(reason, 0) + 1
                        continue
                    
                    # 3. 저장
                    self._create_customer(customer_data)
                    created_count += 1
                    
                except Exception as e:
                    errors.append(f"{index+2}행 에러: {str(e)}")

        # 결과 리턴
        return {
            "message": f"✅ 총 {len(df)}건 중 {created_count}건 성공!",
            "skipped_count": skipped_count,
            "skip_reasons": skip_reasons, # 👇 프론트에서 이유를 볼 수 있게 함
            "errors": errors[:10]
        }

    def _extract_customer_data(self, row):
        name = self._get_value_from_candidates(row, COLUMN_MAPPING['name'])
        raw_phone = self._get_value_from_candidates(row, COLUMN_MAPPING['phone'])
        
        # 이름이나 전화번호가 없으면 None 리턴
        if not name or not raw_phone:
            # 디버깅: 왜 없는지 확인해보고 싶으면 여기서 print(row) 해보세요
            return None
            
        # 전화번호 정제 (하이픈 제거)
        phone = str(raw_phone).replace('-', '').replace(' ', '').strip()
        
        # 분야/지역 데이터 추출
        cat1 = self._get_value_from_candidates(row, COLUMN_MAPPING['category_1'])
        cat2 = self._get_value_from_candidates(row, COLUMN_MAPPING['category_2'])
        cat3 = self._get_value_from_candidates(row, COLUMN_MAPPING['category_3'])
        reg1 = self._get_value_from_candidates(row, COLUMN_MAPPING['region_1'])
        reg2 = self._get_value_from_candidates(row, COLUMN_MAPPING['region_2'])
        
        # 지역 합치기
        region = f"{reg1 or ''} {reg2 or ''}".strip()

        return {
            'name': name,
            'phone': phone,
            'category_1': cat1,
            'category_2': cat2,
            'category_3': cat3,
            'region': region if region else None,
        }

    def _get_value_from_candidates(self, row, candidates):
        """후보 컬럼들을 순회하며 값이 있는 경우 반환"""
        for col in candidates:
            # 1. 컬럼이 엑셀에 있고
            if col in row:
                val = row[col]
                # 2. 값이 비어있지 않은 경우 (None, NaN, 빈문자열 체크)
                if val is not None and str(val).strip() != "" and str(val).lower() != "nan":
                    return str(val).strip()
        return None

    def _is_duplicate_phone(self, phone):
        return Customer.objects.filter(phone=phone).exists()

    def _create_customer(self, data):
        Customer.objects.create(
            name=data['name'],
            phone=data['phone'],
            status=Customer.Status.NEW,
            category_1=data['category_1'],
            category_2=data['category_2'],
            category_3=data['category_3'],
            region=data['region'],
            team=None 
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
    search_fields = [
        'name', 'phone', 'memo', 'region', 'team',
        'category_1', 'category_2', 'category_3',  # 분야 검색 추가
        'region_1', 'region_2',  # 지역 검색 추가
    ] 
    
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
