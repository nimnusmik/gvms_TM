from celery import shared_task
from datetime import datetime, time
import logging
import holidays
import pytz
from django.conf import settings
from django.utils import timezone
from apps.agents.models import Agent, AgentStatus
from .models import AssignmentLog
from .models import SalesAssignment
from .services import assign_leads_to_agent

logger = logging.getLogger('auto_assign')

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

        logger.info(f"=== 자동배정 시작 | {today_kst} | triggered_by={triggered_by} ===")

        if today_kst in kr_holidays:
            holiday_name = kr_holidays.get(today_kst)
            logger.info(f"공휴일 스킵: {holiday_name}")
            AssignmentLog.objects.create(
                triggered_by=triggered_by,
                status='SUCCESS',
                total_assigned=0,
                agent_count=0,
                result_detail={
                    "skipped": "HOLIDAY",
                    "holiday_name": holiday_name,
                    "date": today_kst.isoformat(),
                },
            )
            return f"공휴일 자동배정 스킵: {today_kst} ({holiday_name})"

        # 2. 자동배정 대상/제외 사유 로깅
        all_agents = Agent.objects.select_related("user").order_by("created_at")
        excluded = {
            "OFFLINE": [],
            "AUTO_ASSIGN_OFF": [],
            "CAP_FULL": [],
        }
        eligible = []
        remaining_caps = []

        from datetime import datetime, time as dt_time
        today_start = kst.localize(datetime.combine(today_kst, dt_time.min))
        today_end = kst.localize(datetime.combine(today_kst, dt_time.max))

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
                assigned_at__range=(today_start, today_end),
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

        logger.info(f"배정 대상: {agent_count}명")
        for name, status_, is_auto, cap, remaining in eligible:
            logger.info(f"  [대상] {name} | cap={cap} | 남은={remaining}")
        if excluded["OFFLINE"]:
            for name, status_, is_auto in excluded["OFFLINE"]:
                logger.warning(f"  [제외-OFFLINE] {name}")
        if excluded["AUTO_ASSIGN_OFF"]:
            for name, status_, is_auto in excluded["AUTO_ASSIGN_OFF"]:
                logger.warning(f"  [제외-AUTO_ASSIGN_OFF] {name}")
        if excluded["CAP_FULL"]:
            for name, active, cap in excluded["CAP_FULL"]:
                logger.warning(f"  [제외-CAP_FULL] {name} | 오늘배정={active} / cap={cap}")

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
            count = assign_leads_to_agent(agent, count=agent.daily_cap or 0)
            if count > 0:
                total_assigned += count
                log_data['details'][agent.user.name] = count
                logger.info(f"  [배정완료] {agent.user.name} → {count}건")

        status = 'SUCCESS'
        logger.info(f"=== 배정 완료 | 총 {total_assigned}건 (참여자 {agent_count}명) ===")

    except Exception as e:
        status = 'FAILURE'
        log_data['error'] = str(e)
        logger.error(f"=== 배정 실패 | 원인: {e} ===", exc_info=True)
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
