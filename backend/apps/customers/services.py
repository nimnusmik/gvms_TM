# apps/customers/services.py

from django.db import transaction
from django.utils import timezone
from .models import Customer
from apps.agents.models import Agent

def run_auto_assign_logic(agent: Agent) -> int:
    """
    [핵심 로직] 특정 상담원 1명에게 Daily Cap만큼 고객을 리필(Refill)해주는 함수
    Returns: 배정된 고객 수
    """
    # 1. 배정 대상 검증 (기본 자격 요건)
    if not agent.is_auto_assign:
        return 0
    if agent.status == 'RESIGNED':
        return 0

    if agent.daily_cap <= 0:
        return 0

    assigned_count = 0

    # 2. 트랜잭션 시작 (동시성 제어의 핵심)
    with transaction.atomic():
        # [Step 1] 현재 보유량 체크 (완료된 건 제외, 진행 중인 것만)
        current_holding = Customer.objects.filter(
            assigned_agent=agent,
            status='ASSIGNED'
        ).count()

        # [Step 2] 필요한 개수 계산
        needed_count = agent.daily_cap - current_holding

        if needed_count <= 0:
            return 0 # 이미 꽉 찼음 -> 배정 안 함

        # [Step 3] 줄 수 있는 고객 찾기 (Locking 🔒)
        # select_for_update(): 내가 가져가는 동안 남이 못 건드리게 잠금
        candidates = Customer.objects.select_for_update(skip_locked=True).filter(
            assigned_agent__isnull=True,  # 담당자 없음 (미배정)
            status='NEW',                 # 신규 상태
            team=agent.team               # 상담원과 같은 팀 (관심사 일치)
        ).order_by('created_at')[:needed_count] # 오래된 순으로, 필요한 만큼만 자름

        # 쿼리셋은 리스트로 변환해야 슬라이싱 후 업데이트 가능
        candidate_ids = [c.id for c in candidates]
        
        if not candidate_ids:
            return 0 # 줄 수 있는 DB가 하나도 없음

        # [Step 4] 업데이트 실행 (Bulk Update)
        # 루프보다 한방에 업데이트하는 게 훨씬 빠름
        updated_rows = Customer.objects.filter(id__in=candidate_ids).update(
            assigned_agent=agent,
            status='ASSIGNED',
            assigned_at=timezone.now()
        )
        assigned_count = updated_rows

    # 로그 혹은 결과 리턴
    if assigned_count > 0:
        print(f"✅ [AutoAssign] {agent.user.name}에게 {assigned_count}건 배정 완료 (보유: {current_holding} -> {current_holding + assigned_count})")
    
    return assigned_count