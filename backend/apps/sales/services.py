from django.db import transaction
from django.utils import timezone
from .models import SalesAssignment

def assign_leads_to_agent(agent, count=None): # count가 None이면 자동 계산
    """
    상담원에게 '1차 TM' 신규 DB를 배정하는 로직 (Daily Cap 준수)
    """
    today = timezone.localtime().date()
    
    # 1. 오늘 이미 배정받은 개수 확인 (할당량 체크의 핵심!)
    today_assigned_count = SalesAssignment.objects.filter(
        agent=agent,
        assigned_at__date=today
    ).count()

    # 2. 남은 할당량 계산
    remaining_cap = agent.daily_cap - today_assigned_count
    
    # 할당량이 꽉 찼거나 초과했다면 배정 중단
    if remaining_cap <= 0:
        return 0

    # 3. 요청된 count와 남은 cap 중 작은 것을 선택
    # (예: 10개 달라고 했는데 남은게 3개면 3개만 줌)
    if count is None:
        count = remaining_cap
    else:
        count = min(count, remaining_cap)
    
    if count <= 0:
        return 0

    # 4. 배정 트랜잭션 실행
    with transaction.atomic():
        # 주인 없는(NEW) + 1차(1ST) DB를 가져옴 (Lock)
        target_assignments = SalesAssignment.objects.select_for_update().filter(
            stage='1ST',
            status='NEW',
            agent__isnull=True
        ).order_by('assigned_at')[:count] # 오래된 순으로 배정

        ids_to_update = [a.id for a in target_assignments]
        updated_count = 0
        
        if ids_to_update:
            updated_count = SalesAssignment.objects.filter(id__in=ids_to_update).update(
                agent=agent,
                status='ASSIGNED',
                # updated_at은 auto_now라 update()시 갱신 안될 수 있으므로 명시해주면 좋음
                assigned_at=timezone.now() 
            )

    return updated_count
