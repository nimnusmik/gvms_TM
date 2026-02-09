from django.db import transaction
from django.utils import timezone
from .models import SalesAssignment

def assign_leads_to_agent(agent, count=10):
    """
    상담원에게 '1차 TM' 신규 DB를 배정하는 로직
    """
    # 1. 내가 받을 수 있는 최대량 계산 (일일 할당량 - 이미 받은 개수)
    # (일단 단순하게 요청한 count만큼 주는 걸로 구현)
    
    with transaction.atomic():
        # 2. 주인 없는(NEW) + 1차(1ST) DB를 가져옴 (Lock을 걸어서 중복 배정 방지)
        target_assignments = SalesAssignment.objects.select_for_update().filter(
            stage='1ST',
            status='NEW',
            agent__isnull=True
        )[:count]

        # 3. 업데이트 (주인 이름표 붙이기)
        updated_count = 0
        ids_to_update = [a.id for a in target_assignments]
        
        if ids_to_update:
            updated_count = SalesAssignment.objects.filter(id__in=ids_to_update).update(
                agent=agent,
                status='ASSIGNED',
                assigned_at=timezone.now(),
                updated_at=timezone.now(),
            )

    return updated_count
