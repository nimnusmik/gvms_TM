# apps/customers/services.py
import traceback
from django.db import transaction
from django.utils import timezone
from apps.agents.models import Agent
from .models import Customer, AutoAssignLog # 👈 모델 import

def distribute_customers(limit=50):
    # 1. 주말 체크 (로그 안 남기고 조용히 종료)
    if timezone.now().weekday() >= 5:
        return "주말 스킵"

    log = AutoAssignLog.objects.create(status='FAILURE') # 일단 실패 상태로 기록 생성

    try:
        # 2. 상담원 & 고객 찾기
        agents = list(Agent.objects.exclude(status='OFFLINE'))
        if not agents:
            raise Exception("근무 중인 상담원 없음")

        customers = list(Customer.objects.filter(
            assigned_agent__isnull=True, 
            status=Customer.Status.NEW
        ).order_by('created_at')[:limit])
        
        if not customers:
            raise Exception("배정할 신규 DB 없음")

        # 3. 배정 실행 (Atomic)
        with transaction.atomic():
            updated_list = []
            agent_count = len(agents)
            
            for i, customer in enumerate(customers):
                target_agent = agents[i % agent_count]
                customer.assigned_agent = target_agent
                customer.status = Customer.Status.ASSIGNED
                updated_list.append(customer)
                
            Customer.objects.bulk_update(updated_list, ['assigned_agent', 'status'])
            
            # 4. 성공 시 로그 업데이트 📝
            log.status = 'SUCCESS'
            log.total_assigned = len(updated_list)
            log.agent_count = agent_count
            log.message = f"상담원 {agent_count}명에게 {len(updated_list)}건 균등 배분 완료"
            log.save()
            
            return log.message

    except Exception as e:
        # 5. 실패 시 에러 내용 기록 📝
        log.message = str(e)
        # log.message = traceback.format_exc() # 상세 에러 보고 싶으면 이거 주석 해제
        log.save()
        return f"오류 발생: {str(e)}"