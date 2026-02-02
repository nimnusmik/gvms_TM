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
from apps.agents.models import Agent

# 1. 엑셀 업로드 전용 뷰 (분리)
class CustomerUploadView(APIView):
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def post(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response({"error": "파일이 없습니다."}, status=400)

        try:
            df = pd.read_excel(file)
            
            # NaN(빈값)을 None으로 변환 (올려주신 Celery 로직 반영)
            df = df.where(pd.notnull(df), None)

            # 필수 컬럼 체크
            required = ['이름', '전화번호', '관심분야']
            if not all(col in df.columns for col in required):
                return Response({"error": f"필수 컬럼 누락: {required}"}, status=400)

            # 팀 매핑
            team_map = {
                '배터리': 'BATTERY', '모빌리티': 'MOBILITY',
                '태양광': 'SOLAR', '산업기계': 'MACHINE', '산업 기계': 'MACHINE'
            }

            created_count = 0
            errors = []

            with transaction.atomic():
                for index, row in df.iterrows():
                    try:
                        name = str(row['이름']).strip()
                        raw_phone = str(row['전화번호']) if row['전화번호'] else ""
                        phone = raw_phone.replace('-', '').strip()
                        team_kor = str(row['관심분야']).strip()
                        
                        if not phone: continue # 전화번호 없으면 스킵

                        team_code = team_map.get(team_kor)
                        
                        # 중복 체크
                        if Customer.objects.filter(phone=phone).exists():
                            continue
                            
                        Customer.objects.create(
                            name=name,
                            phone=phone,
                            team=team_code,
                            status='NEW'
                        )
                        created_count += 1
                        
                    except Exception as e:
                        errors.append(f"{index+2}행 에러: {str(e)}")

            return Response({
                "message": f"✅ {created_count}건 업로드 성공!",
                "errors": errors[:5]
            }, status=201)

        except Exception as e:
            return Response({"error": f"파일 처리 중 오류: {str(e)}"}, status=500)


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


    # URL: DELETE /api/v1/customers/reset_db/
    @action(detail=False, methods=['delete'], url_path='reset-db')
    def reset_db(self, request):
        
        if not request.user.is_superuser:
            return Response({"error": "관리자만 가능합니다."}, status=403)

        with transaction.atomic():
            # count()는 삭제된 개수를 반환합니다.
            count, _ = Customer.objects.all().delete()
            
        return Response({
            "message": f"♻️ 고객 DB가 초기화되었습니다. (총 {count}명 삭제됨)",
            "deleted_count": count
        })