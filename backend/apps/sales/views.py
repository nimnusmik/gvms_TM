from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db import transaction
from django.db.models import Count
from django.utils import timezone
from django.shortcuts import get_object_or_404

from .models import SalesAssignment
from .serializers import SalesAssignmentSerializer
from .services import assign_leads_to_agent
from .tasks import task_run_auto_assign
from apps.agents.models import Agent

class SalesAssignmentViewSet(viewsets.ModelViewSet):
    serializer_class = SalesAssignmentSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    
    # 필터링: 1차/2차 구분, 상태별 조회
    filterset_fields = ['stage', 'status', 'sentiment', 'agent']
    # 검색: 고객 이름, 전화번호로 검색
    search_fields = ['customer__name', 'customer__phone', 'memo']
    ordering_fields = ['updated_at', 'assigned_at']
    ordering = ['-updated_at'] # 최근 활동순 정렬

    def get_queryset(self):
        user = self.request.user
        base_qs = SalesAssignment.objects.select_related('customer', 'agent').annotate(
            call_count=Count('call_logs')
        )
        if getattr(user, 'is_superuser', False):
            return base_qs
        if not hasattr(user, 'agent_profile'):
            return base_qs.none() # 상담원 아니면 빈 깡통

        agent = user.agent_profile
        
        # 관리자라면 전체 조회, 상담원이라면 '내 담당'만 조회
        if agent.role in ['ADMIN', 'MANAGER']:
            return base_qs
        
        return base_qs.filter(agent=agent)

    @action(detail=False, methods=['post'])
    def pull(self, request):
        """
        🎯 [땡겨오기] 버튼 클릭 시 호출
        내게 할당된 1차 DB가 부족하면 추가로 가져옴
        """
        agent = request.user.agent_profile
        count = int(request.data.get('count', 10)) # 기본 10개
        
        # 서비스 로직 호출 (3단계에서 만듦)
        assigned_count = assign_leads_to_agent(agent, count=count)
        
        return Response({
            "message": f"{assigned_count}건의 DB를 새로 배정받았습니다.",
            "count": assigned_count
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], url_path='bulk-assign')
    def bulk_assign(self, request):
        ids = request.data.get('ids', [])
        agent_id = request.data.get('agent_id')

        if not ids:
            return Response({"detail": "배정할 데이터를 선택해주세요."}, status=status.HTTP_400_BAD_REQUEST)
        if not agent_id:
            return Response({"detail": "배정할 상담원을 선택해주세요."}, status=status.HTTP_400_BAD_REQUEST)

        agent = get_object_or_404(Agent, pk=agent_id)
        with transaction.atomic():
            updated_count = SalesAssignment.objects.filter(id__in=ids).update(
                agent=agent,
                status='ASSIGNED',
                assigned_at=timezone.now(),
                updated_at=timezone.now()
            )

        return Response({
            "message": f"성공적으로 {updated_count}건을 {agent.user.name}님에게 배정했습니다.",
            "updated_count": updated_count
        })

    @action(detail=False, methods=['post'], url_path='bulk-unassign')
    def bulk_unassign(self, request):
        ids = request.data.get('ids', [])
        if not ids:
            return Response({"detail": "선택된 데이터가 없습니다."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            updated_count = SalesAssignment.objects.filter(id__in=ids).update(
                agent=None,
                status='NEW',
                updated_at=timezone.now()
            )

        return Response({
            "message": f"✅ {updated_count}건의 배정이 취소되었습니다.",
            "updated_count": updated_count
        })

    @action(detail=False, methods=['post'], url_path='run-daily-assign')
    def run_daily_assign(self, request):
        trigger_user = request.user.name if hasattr(request.user, 'name') else request.user.username
        task_run_auto_assign.delay(triggered_by=trigger_user)

        return Response({
            'message': '자동 배정 작업이 시작되었습니다.',
            'info': '결과는 [자동 배정 이력] 메뉴에서 잠시 후 확인 가능합니다.'
        }, status=202)
