from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model

from .models import Agent, AgentStatus
from .serializers import AgentAdminSerializer, AccountSimpleSerializer, AgentSerializer

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
    def destroy(self, request, *args, **kwargs):
        agent = self.get_object()
        
        # TODO: 나중에 'Call' 모델이 생기면 주석 해제하세요!
        # if agent.calls.exists():
        #     return Response(
        #         {"message": "통화 기록이 있는 상담원은 삭제할 수 없습니다. 대신 '퇴사' 상태로 변경하세요."}, 
        #         status=status.HTTP_400_BAD_REQUEST
        #     )
            
        return super().destroy(request, *args, **kwargs)

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