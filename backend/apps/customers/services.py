# apps/customers/services.py

import logging
from django.db import transaction
from django.utils import timezone
from .models import Customer
from apps.agents.models import Agent

logger = logging.getLogger(__name__)


def run_auto_assign_logic(agent: Agent) -> int:
    """
    [핵심 로직] 특정 상담원 1명에게 Daily Cap만큼 고객을 리필(Refill)해주는 함수
    Returns: 배정된 고객 수
    """
    # Early returns: 배정 대상 검증
    if not agent.is_auto_assign:
        return 0
    if agent.status == 'RESIGNED':
        return 0
    if agent.daily_cap <= 0:
        return 0

    # 트랜잭션 시작 (동시성 제어의 핵심)
    with transaction.atomic():
        current_holding = _get_current_holding_count(agent)
        needed_count = agent.daily_cap - current_holding

        if needed_count <= 0:
            return 0  # 이미 꽉 찼음

        candidate_ids = _get_candidate_ids(agent, needed_count)
        if not candidate_ids:
            return 0  # 배정 가능한 고객 없음

        assigned_count = _assign_customers_to_agent(agent, candidate_ids)

    # 로깅
    if assigned_count > 0:
        agent_name = agent.user.name if agent.user else f"Agent_{agent.id}"
        logger.info(
            f"[AutoAssign] {agent_name}에게 {assigned_count}건 배정 완료 "
            f"(보유: {current_holding} -> {current_holding + assigned_count})"
        )
    
    return assigned_count


def _get_current_holding_count(agent: Agent) -> int:
    """현재 상담원이 보유한 고객 수 (ASSIGNED 상태만)"""
    return Customer.objects.filter(
        assigned_agent=agent,
        status=Customer.Status.ASSIGNED
    ).count()


def _get_candidate_ids(agent: Agent, needed_count: int) -> list[int]:
    """
    배정 가능한 고객 ID 목록 조회 (Locking 적용)
    select_for_update(): 내가 가져가는 동안 다른 프로세스가 건드리지 못하게 잠금
    """
    candidates = Customer.objects.select_for_update(skip_locked=True).filter(
        assigned_agent__isnull=True,  # 담당자 없음 (미배정)
        status=Customer.Status.NEW,    # 신규 상태
        team=agent.team                # 상담원과 같은 팀 (관심사 일치)
    ).order_by('created_at')[:needed_count]  # 오래된 순으로, 필요한 만큼만
    
    return [c.id for c in candidates]


def _assign_customers_to_agent(agent: Agent, candidate_ids: list[int]) -> int:
    """고객들을 상담원에게 일괄 배정 (Bulk Update)"""
    return Customer.objects.filter(id__in=candidate_ids).update(
        assigned_agent=agent,
        status=Customer.Status.ASSIGNED,
        assigned_at=timezone.now()
    )