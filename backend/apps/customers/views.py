import pandas as pd
from rest_framework import viewsets, status, parsers, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db import transaction
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone 
from django.shortcuts import get_object_or_404

from .models import Customer
from .serializers import CustomerSerializer
from apps.agents.models import Agent

# 1. 엑셀 업로드 전용 뷰 (분리)
class CustomerUploadView(APIView):
    # 이 뷰는 오직 '파일 업로드'만 처리하므로 파서를 고정합니다.
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def post(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response({"error": "파일이 없습니다."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # 엑셀 읽기 (Pandas)
            df = pd.read_excel(file)
            
            # 필수 컬럼 체크
            required = ['이름', '전화번호', '관심분야']
            if not all(col in df.columns for col in required):
                return Response({"error": f"필수 컬럼 누락: {required}"}, status=400)

            # 팀 매핑 정보
            team_map = {
                '배터리': 'BATTERY',
                '모빌리티': 'MOBILITY',
                '태양광': 'SOLAR',
                '산업기계': 'MACHINE',
                '산업 기계': 'MACHINE' # 띄어쓰기 예외 처리 등 유연하게
            }

            created_count = 0
            errors = []

            # DB 저장 (트랜잭션으로 안전하게)
            with transaction.atomic():
                for index, row in df.iterrows():
                    try:
                        # 데이터 정제
                        name = str(row['이름']).strip()
                        phone = str(row['전화번호']).strip().replace('-', '') # 하이픈 제거
                        team_kor = str(row['관심분야']).strip()
                        
                        team_code = team_map.get(team_kor)
                        
                        # 중복 체크 (전화번호)
                        if Customer.objects.filter(phone=phone).exists():
                            continue # 이미 있으면 스킵
                            
                        Customer.objects.create(
                            name=name,
                            phone=phone,
                            team=team_code, # 매핑된 팀 코드 (없으면 None)
                            status='NEW'    # 신규 상태
                        )
                        created_count += 1
                        
                    except Exception as e:
                        errors.append(f"{index+2}행 에러: {str(e)}")

            return Response({
                "message": f"✅ {created_count}건 업로드 성공!",
                "errors": errors[:5] # 에러는 5개까지만 보여줌
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({"error": f"파일 처리 중 오류: {str(e)}"}, status=500)


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