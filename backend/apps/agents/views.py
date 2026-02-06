from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError

from django.contrib.auth import get_user_model
from django.db import IntegrityError 

from django.db import transaction
from .models import Agent, AgentStatus
from .serializers import AgentAdminSerializer, AccountSimpleSerializer, AgentSerializer
from django.db.models import Count

from apps.customers.services import run_auto_assign_logic, run_auto_assign_batch_all


User = get_user_model()

class AgentViewSet(viewsets.ModelViewSet):
    # 1. 기본 설정: Agent 가져올 때 User 정보도 '미리' 복사해서 가져옴 (빠름!)
    queryset = Agent.objects.select_related('user').all().order_by('-created_at')    

    # 2. 기본 시리얼라이저: 관리자용 (생성/수정 등 모든 필드 포함)
    serializer_class = AgentAdminSerializer

    pagination_class = None # 상담원 API만 페이지네이션 없이 '통짜 배열'을 줍니다.
    
    # 3. 권한 설정: 로그인한 사람만 접근 가능
    permission_classes = [IsAuthenticated]

    # ----------------------------------------------------------------
    # 🌟 기능 1: 상담원 후보자 조회 (이미 등록된 사람 제외하기)
    # URL: GET /api/v1/agents/candidates/
    # ----------------------------------------------------------------
    @action(detail=False, methods=['get'])
    def candidates(self, request):
        # 1. Agent 프로필이 없는(isnull=True) 유저만 찾기
        # 관리자(is_superuser) 제외, 나 자신 제외
        candidates_query = User.objects.filter(
            agent_profile__isnull=True, 
            is_superuser=False
        ).exclude(pk=request.user.pk)
        
        # 2. 데이터 가공 
        data = [{
            "id": user.pk,
            "email": user.email,
            "name": user.name,
            "phone": user.phone_number, # ✨ User 모델에서 바로 가져옴
            "date_joined": user.created_at
        } for user in candidates_query]

        return Response(data)

    # ----------------------------------------------------------------
    # 🌟 기능 2: "내 정보" 가져오기 (대시보드 접속 시 사용)
    # URL: GET /api/v1/agents/me/
    # ----------------------------------------------------------------
    @action(detail=False, methods=['get'])
    def me(self, request):
        try:
            # 로그인한 유저(request.user)의 상담원 프로필을 가져옴
            agent = request.user.agent_profile
            
            # 내 정보는 읽기 전용 시리얼라이저로 안전하게 반환
            serializer = AgentSerializer(agent)
            return Response(serializer.data)
            
        except Agent.DoesNotExist:
            # 아직 상담원으로 등록 안 된 계정이 접속했을 때
            return Response(
                {"detail": "상담원 프로필이 없습니다. 관리자에게 문의하세요."}, 
                status=status.HTTP_404_NOT_FOUND
            )
    # ----------------------------------------------------------------
    # 🌟 기능 3: 조회
    # GET /api/v1/agents/{id}/customers/
    # ----------------------------------------------------------------
    @action(detail=True, methods=['get'])
    def customers(self, request, pk=None):
        agent = self.get_object()
        
        # related_name='customers' 라고 가정 (만약 에러나면 customer_set으로 변경)
        if hasattr(agent, 'customers'):
            my_customers = agent.customers.all().order_by('-created_at')
        else:
            my_customers = agent.customer_set.all().order_by('-created_at')

        serializer = CustomerSerializer(my_customers, many=True)
        return Response(serializer.data)

    queryset = Agent.objects.all()
    serializer_class = AgentSerializer

    def get_queryset(self):
        return Agent.objects.annotate(
            assigned_count=Count('customers')
        ).order_by('-created_at')

    # ----------------------------------------------------------------
    # 🌟 기능 4: 안전한 삭제 (Hard Delete)
    # DELETE /api/v1/agents/{id}/
    # ----------------------------------------------------------------
    def destroy(self, request, *args, **kwargs):
        agent = self.get_object()

        if agent.customers.exists(): 
            print(f"🚨 삭제 차단됨! 잔류 고객: {list(agent.customers.values('id', 'name', 'status'))}")
            return Response(
                 {"error": "배정된 고객이나 상담 이력이 있는 직원은 삭제할 수 없습니다. 대신 '퇴사' 처리를 이용해주세요."}, 
                 status=status.HTTP_400_BAD_REQUEST
             )

        user = agent.user
        with transaction.atomic():
            super().destroy(request, *args, **kwargs)
            user.delete()

        return Response({"message": "상담원과 계정이 완전히 삭제되었습니다."})


    # ----------------------------------------------------------------
    # 🌟 기능 5: 퇴사 처리 (Soft Delete)
    # POST /api/v1/agents/{id}/resign/
    # ----------------------------------------------------------------
    @action(detail=True, methods=['post'])
    def resign(self, request, pk=None):
        agent = self.get_object()

        # 이미 퇴사자인지 확인
        if agent.status == 'RESIGNED':
            return Response({"message": "이미 퇴사 처리된 상담원입니다."}, status=status.HTTP_200_OK)

        with transaction.atomic():
            # 1. 상담원 상태 변경
            agent.status = 'RESIGNED'
            agent.save()

            # 2. 로그인 차단 (User 테이블의 is_active를 False로)
            user = agent.user
            user.is_active = False 
            user.save()
            
            # 3. [핵심] 배정된 고객 회수 (ASSIGNED -> NEW, 담당자 None)
            # 완료(COMPLETED)된 건은 건드리지 않고, 진행 중인 건만 회수합니다.
            if hasattr(agent, 'customers'):
                active_customers = agent.customers.filter(status='ASSIGNED')
            else:
                active_customers = agent.customer_set.filter(status='ASSIGNED')
            
            # 회수된 고객 수 저장 (메시지용)
            released_count = active_customers.count()
            
            # 일괄 업데이트 (담당자 해제 및 상태 초기화)
            active_customers.update(assigned_agent=None, status='NEW')

        return Response({
            "message": f"{agent.user.name} 님의 퇴사 처리가 완료되었습니다. (고객 {released_count}명 배정 취소됨)",
            "status": agent.status,
            "released_count": released_count
        })

    # ----------------------------------------------------------------
    # 🌟 기능 6: 퇴사 처리 (Soft Delete)
    # POST /api/v1/agents/{id}/resign/
    # ----------------------------------------------------------------
    @action(detail=False, methods=['get'], url_path='dashboard_stats')
    def dashboard_stats(self, request):
        from apps.customers.models import Customer 

        # 1. [상담원] 통계
        total_agents = Agent.objects.count()
        active_agents = Agent.objects.exclude(status='OFFLINE').count()

        # 2. [고객] 통계
        total_customers = Customer.objects.count()
        success_customers = Customer.objects.filter(status=Customer.Status.SUCCESS).count()


        # 3. 성공률
        if total_customers > 0:
            success_rate = (success_customers / total_customers) * 100
        else:
            success_rate = 0

        data = {
            "total_customers": total_customers,
            "active_agents": active_agents,
            "total_agents": total_agents,
            "success_rate": round(success_rate, 1)
        }
        
        return Response(data)


    def perform_create(self, serializer):
        try:
            # 1. 상담원 저장 시도
            agent = serializer.save()
            
            # 2. [시나리오 A] 저장 성공 시 자동 배정 로직 실행
            if agent.is_auto_assign:
                from apps.customers.services import run_auto_assign_logic
                run_auto_assign_logic(agent)
                
        except IntegrityError:
            # 🚨 이미 존재하는 계정일 경우 발생하는 DB 에러를 잡아서
            # 프론트엔드에게 "400 Bad Request"로 친절하게 알려줍니다.
            raise ValidationError({"detail": "이미 상담원으로 등록된 계정입니다. (중복 등록 불가)"})

    def perform_update(self, serializer):
        # 수정 시에도(예: 팀 변경, Cap 증가 등) 배정 로직을 돌릴지 결정
        agent = serializer.save()
        
        # 예: 배정 기능이 꺼져있다가 켜진 경우 즉시 배정
        if agent.is_auto_assign:
            run_auto_assign_logic(agent)

    # POST /api/v1/agents/run_daily_assign/
    @action(detail=False, methods=['post'], url_path='run-daily-assign')
    def run_daily_assign(self, request):
        # 1. 대상 상담원 선정 (퇴사자 제외, 자동배정 켜진 사람)
        active_agents = Agent.objects.exclude(status='RESIGNED').filter(is_auto_assign=True).order_by('created_at')

        assigned_map = run_auto_assign_batch_all(list(active_agents))
        total_assigned = sum(assigned_map.values())
        agent_count = sum(1 for v in assigned_map.values() if v > 0)

        return Response({
            "message": f"총 {len(active_agents)}명 중 {agent_count}명에게 {total_assigned}건의 DB가 리필되었습니다."
        })
