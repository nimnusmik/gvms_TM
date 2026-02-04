# apps/customers/tasks.py

from celery import shared_task
from django.utils import timezone
import traceback

# 모델 및 로직 import
from .models import AssignmentLog
from apps.agents.models import Agent
from .services import run_auto_assign_logic  # 작성하신 핵심 로직 import

@shared_task
def task_run_auto_assign(triggered_by='SYSTEM'):
    """
    [Celery Task] 모든 상담원을 순회하며 자동 배정 로직 실행 & 로그 저장
    """
    # 1. 로그 데이터 초기화
    log_data = {
        'triggered_by': triggered_by,
        'status': 'SUCCESS',
        'total_assigned': 0,
        'agent_count': 0,
        'result_detail': {},   # {"김철수": 10, "이영희": 5}
        'error_message': ''
    }

    try:
        # 2. 배정 대상 상담원 조회 (퇴사자 제외, 자동배정 켜진 사람만)
        # select_related로 user 정보 미리 가져오기 (쿼리 최적화)
        agents = Agent.objects.select_related('user').filter(
            status='ONLINE',
            is_auto_assign=True
        )
        
        log_data['agent_count'] = agents.count()

        if log_data['agent_count'] == 0:
            log_data['status'] = 'FAILURE'
            log_data['error_message'] = "자동 배정이 활성화된 상담원이 없습니다."
        
        else:
            # 3. 상담원 순회하며 배정 실행 (핵심)
            for agent in agents:
                try:
                    # services.py의 핵심 함수 호출!
                    assigned_count = run_auto_assign_logic(agent)
                    
                    if assigned_count > 0:
                        log_data['total_assigned'] += assigned_count
                        # 상세 내역 기록 (이름: 개수)
                        agent_name = agent.user.name if agent.user else f"Agent_{agent.id}"
                        log_data['result_detail'][agent_name] = assigned_count

                except Exception as inner_e:
                    # 한 명 실패해도 멈추지 않고 다음 사람 진행 (로그만 남김)
                    agent_name = agent.user.name if agent.user else f"Agent_{agent.id}"
                    log_data['result_detail'][f"{agent_name}_ERROR"] = str(inner_e)

            # 4. 결과 메시지 정리
            if log_data['total_assigned'] == 0:
                log_data['result_detail']['info'] = "조건에 맞는 신규 DB가 없거나, 모든 상담원의 할당량이 꽉 찼습니다."

    except Exception as e:
        # 전체 로직 에러 처리
        log_data['status'] = 'FAILURE'
        log_data['error_message'] = str(e)
        log_data['result_detail']['traceback'] = traceback.format_exc()
        print(f"❌ [Celery Error] Auto Assign Failed: {e}")

    finally:
        # 5. DB에 이력 저장 (AssignmentLog)
        AssignmentLog.objects.create(
            triggered_by=log_data['triggered_by'],
            status=log_data['status'],
            total_assigned=log_data['total_assigned'],
            agent_count=log_data['agent_count'],
            result_detail=log_data['result_detail'],
            error_message=log_data['error_message']
        )

    return f"Auto Assign Finished: {log_data['status']} ({log_data['total_assigned']} assigned)"
