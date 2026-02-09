# apps/customers/services.py

import logging
from django.db import transaction
from django.utils import timezone
from django.db.models import Count
from apps.sales.models import SalesAssignment
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
    """현재 상담원이 보유한 리드 수 (ASSIGNED 상태만)"""
    return SalesAssignment.objects.filter(
        agent=agent,
        stage=SalesAssignment.Stage.FIRST,
        status=SalesAssignment.Status.ASSIGNED
    ).count()


def _get_candidate_ids(agent: Agent, needed_count: int) -> list[int]:
    """
    배정 가능한 고객 ID 목록 조회 (Locking 적용)
    select_for_update(): 내가 가져가는 동안 다른 프로세스가 건드리지 못하게 잠금
    """
    candidates = SalesAssignment.objects.select_for_update(skip_locked=True).filter(
        agent__isnull=True,  # 담당자 없음 (미배정)
        stage=SalesAssignment.Stage.FIRST,
        status=SalesAssignment.Status.NEW
    ).order_by('assigned_at')[:needed_count]  # 오래된 순으로, 필요한 만큼만
    
    return [c.id for c in candidates]


def _assign_customers_to_agent(agent: Agent, candidate_ids: list[int]) -> int:
    """리드들을 상담원에게 일괄 배정 (Bulk Update)"""
    return SalesAssignment.objects.filter(id__in=candidate_ids).update(
        agent=agent,
        status=SalesAssignment.Status.ASSIGNED,
        assigned_at=timezone.now()
    )


def run_auto_assign_batch_all(agents: list[Agent]) -> dict[int, int]:
    """
    [배치 로직] 전체 상담원 풀에 대해 고객을 등록순으로 균등 배정
    Returns: {agent_id: assigned_count}
    """
    if not agents:
        return {}

    # 현재 보유량을 한 번에 계산
    holding_counts = {
        row["agent"]: row["count"]
        for row in SalesAssignment.objects.filter(
            agent__in=agents,
            stage=SalesAssignment.Stage.FIRST,
            status=SalesAssignment.Status.ASSIGNED
        )
        .values("agent")
        .annotate(count=Count("id"))
    }

    # 필요한 수량 계산
    needed_by_agent: dict[int, int] = {}
    total_needed = 0
    for agent in agents:
        current_holding = holding_counts.get(agent.agent_id, 0)
        needed = max(agent.daily_cap - current_holding, 0)
        if needed > 0:
            needed_by_agent[agent.agent_id] = needed
            total_needed += needed

    if total_needed == 0:
        return {agent.agent_id: 0 for agent in agents}

    assigned_by_agent: dict[int, int] = {agent.agent_id: 0 for agent in agents}

    # 전체 풀 기준으로 한 번에 후보를 잠금
    with transaction.atomic():
        candidates = list(
            SalesAssignment.objects.select_for_update(skip_locked=True)
            .filter(
                agent__isnull=True,
                stage=SalesAssignment.Stage.FIRST,
                status=SalesAssignment.Status.NEW,
            )
            .order_by("assigned_at")[:total_needed]
        )

        if not candidates:
            return assigned_by_agent

        agent_cycle = [agent for agent in agents if needed_by_agent.get(agent.agent_id, 0) > 0]
        if not agent_cycle:
            return assigned_by_agent

        assigned_ids_by_agent: dict[int, list[int]] = {agent.agent_id: [] for agent in agent_cycle}
        idx = 0

        for customer in candidates:
            # 필요한 인원이 있을 때까지 순회
            while needed_by_agent[agent_cycle[idx].agent_id] <= 0:
                idx = (idx + 1) % len(agent_cycle)

            agent_id = agent_cycle[idx].agent_id
            assigned_ids_by_agent[agent_id].append(customer.id)
            needed_by_agent[agent_id] -= 1
            idx = (idx + 1) % len(agent_cycle)

        now = timezone.now()
        for agent in agent_cycle:
            ids = assigned_ids_by_agent.get(agent.agent_id, [])
            if not ids:
                continue
            updated = SalesAssignment.objects.filter(id__in=ids).update(
                agent=agent,
                status=SalesAssignment.Status.ASSIGNED,
                assigned_at=now,
            )
            assigned_by_agent[agent.agent_id] = updated

    return assigned_by_agent
