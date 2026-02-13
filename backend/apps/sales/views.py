from rest_framework import viewsets, status, filters, permissions
from rest_framework.exceptions import ValidationError
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db import transaction
from django.db.models import Count, Prefetch
from django.utils import timezone
from django.shortcuts import get_object_or_404

from .models import SalesAssignment, SalesPullRequest
from .serializers import SalesAssignmentSerializer, SalesPullRequestSerializer
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
        ).prefetch_related(
            Prefetch(
                'child_assignments',
                queryset=SalesAssignment.objects.filter(stage='2ND').select_related('agent', 'agent__user'),
                to_attr='secondary_assignments'
            )
        )

        secondary_status = self.request.query_params.get('secondary_status')
        secondary_agent = self.request.query_params.get('secondary_agent')
        if secondary_status:
            base_qs = base_qs.filter(
                child_assignments__stage='2ND',
                child_assignments__status=secondary_status
            )
        if secondary_agent:
            base_qs = base_qs.filter(
                child_assignments__stage='2ND',
                child_assignments__agent_id=secondary_agent
            )
        if secondary_status or secondary_agent:
            base_qs = base_qs.distinct()
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

    @action(detail=False, methods=['post'], url_path='bulk-delete')
    def bulk_delete(self, request):
        ids = request.data.get('ids', [])
        if not ids:
            return Response({"detail": "삭제할 데이터를 선택해주세요."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            child_deleted = SalesAssignment.objects.filter(parent_assignment_id__in=ids).delete()[0]
            parent_deleted = SalesAssignment.objects.filter(id__in=ids).delete()[0]

        return Response({
            "message": f"✅ {parent_deleted}건 삭제, 2차 {child_deleted}건 삭제 완료",
            "deleted_count": parent_deleted,
            "deleted_secondary_count": child_deleted
        })

    @action(detail=False, methods=['post'], url_path='run-daily-assign')
    def run_daily_assign(self, request):
        trigger_user = request.user.name if hasattr(request.user, 'name') else request.user.username
        task_run_auto_assign.delay(triggered_by=trigger_user)

        return Response({
            'message': '자동 배정 작업이 시작되었습니다.',
            'info': '결과는 [자동 배정 이력] 메뉴에서 잠시 후 확인 가능합니다.'
        }, status=202)

    @action(detail=True, methods=['post'], url_path='assign-secondary')
    def assign_secondary(self, request, pk=None):
        assignment = self.get_object()
        agent_id = request.data.get('agent_id')

        if assignment.stage != SalesAssignment.Stage.FIRST:
            return Response({"detail": "1차 배정 건만 2차 배정이 가능합니다."}, status=status.HTTP_400_BAD_REQUEST)
        if assignment.status != SalesAssignment.Status.SUCCESS:
            return Response({"detail": "SUCCESS 상태인 건만 2차 배정이 가능합니다."}, status=status.HTTP_400_BAD_REQUEST)
        if assignment.child_assignments.filter(stage='2ND').exists():
            return Response({"detail": "이미 2차 배정이 존재합니다."}, status=status.HTTP_400_BAD_REQUEST)
        if not agent_id:
            return Response({"detail": "2차 담당자를 선택해주세요."}, status=status.HTTP_400_BAD_REQUEST)

        agent = get_object_or_404(Agent, pk=agent_id)

        secondary = SalesAssignment.objects.create(
            customer=assignment.customer,
            agent=agent,
            parent_assignment=assignment,
            stage=SalesAssignment.Stage.SECOND,
            status=SalesAssignment.Status.ASSIGNED,
        )

        serializer = self.get_serializer(secondary)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


# [2] 땡겨오기 신청/승인 ViewSet
class SalesPullRequestViewSet(viewsets.ModelViewSet):
    serializer_class = SalesPullRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'agent']
    ordering_fields = ['created_at', 'processed_at']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        base_qs = SalesPullRequest.objects.select_related(
            'agent', 'agent__user', 'processed_by', 'processed_by__user'
        )

        if getattr(user, 'is_superuser', False):
            return base_qs
        if not hasattr(user, 'agent_profile'):
            return base_qs.none()

        agent = user.agent_profile
        if agent.role in ['ADMIN', 'MANAGER']:
            return base_qs
        return base_qs.filter(agent=agent)

    def perform_create(self, serializer):
        if not hasattr(self.request.user, 'agent_profile'):
            raise ValidationError({"detail": "상담원 프로필이 필요합니다."})
        serializer.save(agent=self.request.user.agent_profile)

    def _ensure_admin(self, request):
        if getattr(request.user, 'is_superuser', False):
            return True
        if not hasattr(request.user, 'agent_profile'):
            return False
        return request.user.agent_profile.role in ['ADMIN', 'MANAGER']

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        if not self._ensure_admin(request):
            return Response({"detail": "권한이 없습니다."}, status=status.HTTP_403_FORBIDDEN)

        pull_request = self.get_object()
        if pull_request.status != SalesPullRequest.Status.PENDING:
            return Response({"detail": "이미 처리된 요청입니다."}, status=status.HTTP_400_BAD_REQUEST)

        assigned_count = assign_leads_to_agent(pull_request.agent, count=pull_request.requested_count)
        pull_request.status = SalesPullRequest.Status.APPROVED
        pull_request.approved_count = assigned_count
        pull_request.processed_by = getattr(request.user, 'agent_profile', None)
        pull_request.processed_at = timezone.now()
        pull_request.save(update_fields=[
            'status', 'approved_count', 'processed_by', 'processed_at', 'updated_at'
        ])

        return Response({
            "message": f"{assigned_count}건을 배정했습니다.",
            "assigned_count": assigned_count,
            "request_id": pull_request.id
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        if not self._ensure_admin(request):
            return Response({"detail": "권한이 없습니다."}, status=status.HTTP_403_FORBIDDEN)

        pull_request = self.get_object()
        if pull_request.status != SalesPullRequest.Status.PENDING:
            return Response({"detail": "이미 처리된 요청입니다."}, status=status.HTTP_400_BAD_REQUEST)

        reject_reason = request.data.get('reason', '') or ''
        pull_request.status = SalesPullRequest.Status.REJECTED
        pull_request.reject_reason = reject_reason
        pull_request.processed_by = getattr(request.user, 'agent_profile', None)
        pull_request.processed_at = timezone.now()
        pull_request.save(update_fields=[
            'status', 'reject_reason', 'processed_by', 'processed_at', 'updated_at'
        ])

        return Response({
            "message": "요청을 거절했습니다.",
            "request_id": pull_request.id
        }, status=status.HTTP_200_OK)
