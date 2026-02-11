from celery import shared_task
from apps.agents.models import Agent, AgentStatus
from .models import AssignmentLog
from .services import assign_leads_to_agent

@shared_task
def task_run_auto_assign(triggered_by='SYSTEM'):
    """매일 아침 실행되는 자동 배정 태스크"""
    log_data = {'details': {}}
    total_assigned = 0
    agent_count = 0

    try:
        # 1. 온라인 상태이며, 자동 배정을 켜둔 상담원 찾기
        agents = Agent.objects.filter(status=AgentStatus.ONLINE, is_auto_assign=True)
        agent_count = agents.count()

        for agent in agents:
            # 2. 서비스 로직 호출 (상담원별 일일 할당량 기준)
            count = assign_leads_to_agent(agent, count=agent.daily_cap or 0)
            if count > 0:
                total_assigned += count
                log_data['details'][agent.user.name] = count
        
        status = 'SUCCESS' if total_assigned > 0 else 'FAILURE'

    except Exception as e:
        status = 'FAILURE'
        log_data['error'] = str(e)
        print(f"❌ 배정 실패: {e}")
    
    # 3. 결과 기록 (Agent Count 포함!)
    AssignmentLog.objects.create(
        triggered_by=triggered_by,
        status=status,
        total_assigned=total_assigned,
        agent_count=agent_count,
        result_detail=log_data
    )
    
    return f"배정 완료: {total_assigned}건 (참여자: {agent_count}명)"
