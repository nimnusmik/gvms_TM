from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError

from django.contrib.auth import get_user_model
from django.db import IntegrityError 

from django.db import transaction
from .models import Agent
from .serializers import AgentSerializer
from django.db.models import Count, Q, Sum
from django.db.models.functions import Coalesce, TruncDate
from django.utils import timezone
from datetime import timedelta

from apps.customers.services import run_auto_assign_logic, run_auto_assign_batch_all
from apps.sales.models import SalesAssignment
from apps.sales.serializers import SalesAssignmentSerializer

from apps.calls.models import CallLog

User = get_user_model()

class AgentViewSet(viewsets.ModelViewSet):
    # 1. 기본 설정: Agent 가져올 때 User 정보도 '미리' 복사해서 가져옴 (빠름!)
    queryset = Agent.objects.select_related('user').all().order_by('-created_at')    

    # 2. 기본 시리얼라이저: 관리자용 (생성/수정 등 모든 필드 포함)
    serializer_class = AgentSerializer

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
        
        my_assignments = SalesAssignment.objects.filter(agent=agent).select_related('customer').annotate(
            call_count=Count('call_logs')
        ).order_by('-updated_at')
        serializer = SalesAssignmentSerializer(my_assignments, many=True)
        return Response(serializer.data)

    def get_queryset(self):
        return Agent.objects.annotate(
            assigned_count=Count(
                'assignments',
                filter=Q(assignments__status__in=['ASSIGNED', 'TRYING'])
            )
        ).order_by('-created_at')

    # ----------------------------------------------------------------
    # 🌟 기능 4: 안전한 삭제 (Hard Delete)
    # DELETE /api/v1/agents/{id}/
    # ----------------------------------------------------------------
    def destroy(self, request, *args, **kwargs):
        agent = self.get_object()

        if agent.assignments.exists():
            print(f"🚨 삭제 차단됨! 잔류 배정: {list(agent.assignments.values('id', 'status'))}")
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
            active_assignments = agent.assignments.filter(status__in=['ASSIGNED', 'TRYING'])
            
            # 회수된 고객 수 저장 (메시지용)
            released_count = active_assignments.count()
            
            # 일괄 업데이트 (담당자 해제 및 상태 초기화)
            active_assignments.update(agent=None, status='NEW')

        return Response({
            "message": f"{agent.user.name} 님의 퇴사 처리가 완료되었습니다. (고객 {released_count}명 배정 취소됨)",
            "status": agent.status,
            "released_count": released_count
        })

    
    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        """
        📊 대시보드용 통합 통계 API
        - 요청: GET /api/v1/agents/dashboard_stats/?team=SALES_TM
        """
        today = timezone.localtime().date()
        team_filter = request.query_params.get('team')

        # 1. [상담원 리스트] + [오늘의 성과] 한 방에 조회 (annotate 사용)
        agents = Agent.objects.all()
        
        if team_filter:
            agents = agents.filter(team=team_filter)

        # 🚀 쿼리 최적화: CallLog 테이블을 조인해서 통계 계산
        agent_stats = agents.annotate(
            # 오늘 총 콜 수
            today_total=Count('call_history', filter=Q(call_history__created_at__date=today)),
            
            # 오늘 성공(동의) 수
            today_success=Count('call_history', filter=Q(
                call_history__created_at__date=today, 
                call_history__result='SUCCESS'
            )),
            
            # 오늘 총 통화 시간 (초 단위 합계, 없으면 0)
            today_duration=Coalesce(Sum('call_history__duration', filter=Q(call_history__created_at__date=today)), 0)
        ).values(
            'agent_id', 'user__name', 'team', 'status', 'daily_cap', 
            'today_total', 'today_success', 'today_duration', 'assigned_phone'
        )

        # 2. [데이터 가공] 프론트엔드 포맷에 맞게 변환
        cards_data = []
        table_data = []

        for stat in agent_stats:
            # 성공률 계산 (0으로 나누기 방지)
            success_rate = 0
            if stat['today_total'] > 0:
                success_rate = round((stat['today_success'] / stat['today_total']) * 100, 1)

            # 초 -> MM:SS 형식 변환
            duration_str = self._format_duration(stat['today_duration'])

            # (A) 하단 카드용 데이터
            cards_data.append({
                'id': str(stat['agent_id']),
                'name': stat['user__name'],
                'team': stat['team'], # 혹은 get_team_display() 필요시 별도 처리
                'status': stat['status'],
                'todayCalls': stat['today_total'],
                'successRate': success_rate,
                'dailyGoal': stat['daily_cap'],
                'totalCallTime': duration_str,
                'avatar': None # 프로필 이미지 URL이 있다면 추가
            })

            # (B) 좌상단 테이블용 데이터
            table_data.append({
                'name': stat['user__name'],
                'successRate': success_rate,
                'avgCallTime': self._calculate_avg_time(stat['today_duration'], stat['today_total']),
                'contractCount': stat['today_success'] # 일단 성공 콜 수를 계약 수로 간주
            })

        # 3. [차트 데이터] 최근 7일간 추이
        seven_days_ago = today - timedelta(days=6)
        
        daily_trends = CallLog.objects.filter(
            created_at__date__gte=seven_days_ago
        ).annotate(
            date=TruncDate('created_at')
        ).values('date').annotate(
            totalCalls=Count('id'),
            successCount=Count('id', filter=Q(result='SUCCESS')),
            failCount=Count('id', filter=Q(result='REJECT'))
        ).order_by('date')

        chart_data = []
        for trend in daily_trends:
            chart_data.append({
                'date': trend['date'].strftime('%m/%d'), # 02/09 형식
                'totalCalls': trend['totalCalls'],
                'successCount': trend['successCount'],
                'failCount': trend['failCount']
            })

        return Response({
            "cards": cards_data,
            "table": table_data,
            "chart": chart_data
        })

    def _format_duration(self, seconds):
        """초 -> MM:SS 변환 헬퍼"""
        if not seconds:
            return "00:00"
        m, s = divmod(seconds, 60)
        h, m = divmod(m, 60)
        if h > 0:
            return f"{h:02d}:{m:02d}:{s:02d}"
        return f"{m:02d}:{s:02d}"

    def _calculate_avg_time(self, total_seconds, count):
        """평균 통화 시간 계산"""
        if count == 0:
            return "00:00"
        avg_seconds = int(total_seconds / count)
        return self._format_duration(avg_seconds)

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
