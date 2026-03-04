from celery import shared_task
from datetime import datetime, time
import holidays
import pytz
from django.conf import settings
from django.utils import timezone
from apps.agents.models import Agent, AgentStatus
from .models import AssignmentLog
from .models import SalesAssignment
from .services import assign_leads_to_agent

@shared_task
def task_run_auto_assign(triggered_by='SYSTEM'):
    """매일 아침 실행되는 자동 배정 태스크"""
    log_data = {'details': {}}
    total_assigned = 0
    agent_count = 0

    try:
        # 1. 공휴일 스킵 (KST 기준)
        kst = pytz.timezone("Asia/Seoul")
        today_kst = timezone.localtime(timezone.now(), kst).date()
        kr_holidays = holidays.KR()
        if today_kst in kr_holidays:
            AssignmentLog.objects.create(
                triggered_by=triggered_by,
                status='SUCCESS',
                total_assigned=0,
                agent_count=0,
                result_detail={
                    "skipped": "HOLIDAY",
                    "holiday_name": kr_holidays.get(today_kst),
                    "date": today_kst.isoformat(),
                },
            )
            return f"공휴일 자동배정 스킵: {today_kst} ({kr_holidays.get(today_kst)})"

        # 2. 자동배정 대상/제외 사유 로깅
        all_agents = Agent.objects.select_related("user").order_by("created_at")
        excluded = {
            "OFFLINE": [],
            "AUTO_ASSIGN_OFF": [],
            "CAP_FULL": [],
        }
        eligible = []
        remaining_caps = []

        for agent in all_agents:
            if agent.status != AgentStatus.ONLINE:
                remaining_caps.append(
                    (agent.user.name, agent.status, agent.is_auto_assign, agent.daily_cap, None)
                )
                excluded["OFFLINE"].append(
                    (agent.user.name, agent.status, agent.is_auto_assign)
                )
                continue
            if not agent.is_auto_assign:
                remaining_caps.append(
                    (agent.user.name, agent.status, agent.is_auto_assign, agent.daily_cap, None)
                )
                excluded["AUTO_ASSIGN_OFF"].append(
                    (agent.user.name, agent.status, agent.is_auto_assign)
                )
                continue

            active_assigned = SalesAssignment.objects.filter(
                agent=agent,
                stage=SalesAssignment.Stage.FIRST,
                status__in=[
                    SalesAssignment.Status.ASSIGNED,
                    SalesAssignment.Status.TRYING,
                    SalesAssignment.Status.HOLD,
                ],
            ).count()
            remaining_cap = agent.daily_cap - active_assigned
            remaining_caps.append(
                (agent.user.name, agent.status, agent.is_auto_assign, agent.daily_cap, remaining_cap)
            )
            if remaining_cap <= 0:
                excluded["CAP_FULL"].append(
                    (agent.user.name, active_assigned, agent.daily_cap)
                )
                continue
            eligible.append(
                (agent.user.name, agent.status, agent.is_auto_assign, agent.daily_cap, remaining_cap)
            )

        agents = Agent.objects.filter(status=AgentStatus.ONLINE, is_auto_assign=True)
        agent_count = len(eligible)
        print(f"📌 자동배정 대상({agent_count}명, cap>0): {eligible}")
        if excluded["OFFLINE"]:
            print(f"⛔ 제외(OFFLINE): {excluded['OFFLINE']}")
        if excluded["AUTO_ASSIGN_OFF"]:
            print(f"⛔ 제외(AUTO_ASSIGN_OFF): {excluded['AUTO_ASSIGN_OFF']}")
        if excluded["CAP_FULL"]:
            print(f"⛔ 제외(CAP_FULL): {excluded['CAP_FULL']}")
        if remaining_caps:
            print(f"📊 remaining_cap: {remaining_caps}")

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
