import math
from datetime import timedelta
from datetime import datetime, time # 추가
import pytz
from django.conf import settings
from django.db import transaction
from django.db.models import Exists, F, OuterRef, Q, Subquery
from django.db.models.functions import Coalesce
from django.utils import timezone
from .models import SalesAssignment
from apps.calls.models import CallLog
from apps.customers.models import Customer

RECYCLE_COOLDOWN_DAYS = getattr(settings, "RECYCLE_COOLDOWN_DAYS", 14)
RECYCLE_MAX_COUNT = getattr(settings, "RECYCLE_MAX_COUNT", 2)
RECYCLE_TRYING_EXPIRE_DAYS = getattr(settings, "RECYCLE_TRYING_EXPIRE_DAYS", 7)
RECYCLE_MIX_RATIO = getattr(settings, "RECYCLE_MIX_RATIO", 0.3)

def _get_latest_assignment_queryset():
    latest_assignment_subq = SalesAssignment.objects.filter(
        customer_id=OuterRef("customer_id")
    ).order_by("-assigned_at", "-id").values("id")[:1]

    return SalesAssignment.objects.annotate(
        latest_id=Subquery(latest_assignment_subq)
    ).filter(id=F("latest_id"))

def get_recycle_candidates(limit, exclude_agent_id=None):
    now = timezone.now()
    cooldown_cutoff = now - timedelta(days=RECYCLE_COOLDOWN_DAYS)
    trying_cutoff = now - timedelta(days=RECYCLE_TRYING_EXPIRE_DAYS)

    last_call_subq = CallLog.objects.filter(
        assignment_id=OuterRef("id")
    ).order_by("-call_start").values("call_start")[:1]

    active_assignment_exists = SalesAssignment.objects.filter(
        customer_id=OuterRef("customer_id"),
        stage=SalesAssignment.Stage.FIRST,
        status__in=[
            SalesAssignment.Status.NEW,
            SalesAssignment.Status.ASSIGNED,
            SalesAssignment.Status.TRYING,
        ],
    )

    qs = _get_latest_assignment_queryset().annotate(
        last_call_at=Subquery(last_call_subq),
        has_active_assignment=Exists(active_assignment_exists),
    ).annotate(
        last_contact_at=Coalesce(F("last_call_at"), F("assigned_at")),
    ).filter(
        has_active_assignment=False,
        customer__recycle_count__lt=RECYCLE_MAX_COUNT,
    )

    status_filter = Q(status__in=[SalesAssignment.Status.REJECT, SalesAssignment.Status.HOLD])
    trying_filter = Q(
        status=SalesAssignment.Status.TRYING,
        last_contact_at__lte=trying_cutoff,
    )

    qs = qs.filter(status_filter | trying_filter)
    qs = qs.filter(last_contact_at__lte=cooldown_cutoff)

    if exclude_agent_id is not None:
        qs = qs.exclude(agent_id=exclude_agent_id)

    return qs.order_by("last_contact_at")[:limit]

def create_recycled_assignments(agent, count):
    if count <= 0:
        return 0

    with transaction.atomic():
        candidates = list(
            get_recycle_candidates(count, exclude_agent_id=agent.id).select_for_update()
        )
        if not candidates:
            return 0

        customer_ids = [c.customer_id for c in candidates]
        Customer.objects.filter(id__in=customer_ids).update(
            recycle_count=F("recycle_count") + 1
        )

        assignments = [
            SalesAssignment(
                customer=candidate.customer,
                parent_assignment=candidate,
                stage=SalesAssignment.Stage.FIRST,
                status=SalesAssignment.Status.ASSIGNED,
                agent=agent,
            )
            for candidate in candidates
        ]
        SalesAssignment.objects.bulk_create(assignments)

        return len(assignments)

def assign_leads_to_agent(agent, count=None): # count가 None이면 자동 계산
    """
    상담원에게 '1차 TM' 신규 DB를 배정하는 로직 (Daily Cap 준수)
    """
    kst = pytz.timezone('Asia/Seoul')
    today_kst = timezone.localtime(timezone.now(), kst).date()
    start_of_day = kst.localize(datetime.combine(today_kst, time.min))
    end_of_day = kst.localize(datetime.combine(today_kst, time.max))
    if settings.USE_TZ:
        start_of_day = start_of_day.astimezone(pytz.UTC)
        end_of_day = end_of_day.astimezone(pytz.UTC)
    
    # 1. 오늘 이미 배정받은 개수 확인 (할당량 체크의 핵심!)
    today_assigned_count = SalesAssignment.objects.filter(
        agent=agent,
        assigned_at__range=(start_of_day, end_of_day)
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

    target_new = int(math.ceil(count * (1 - RECYCLE_MIX_RATIO)))
    target_recycle = count - target_new

    assigned_new = 0
    assigned_recycle = 0

    # 4. 신규 배정 트랜잭션 실행
    with transaction.atomic():
        target_assignments = SalesAssignment.objects.select_for_update().filter(
            stage=SalesAssignment.Stage.FIRST, # 변경
            status=SalesAssignment.Status.NEW, # 변경
            agent__isnull=True
        ).order_by('assigned_at')[:target_new]

        ids_to_update = list(target_assignments.values_list('id', flat=True))

        if ids_to_update:
            assigned_new = SalesAssignment.objects.filter(id__in=ids_to_update).update(
                agent=agent,
                status=SalesAssignment.Status.ASSIGNED, # 변경
                assigned_at=timezone.now() 
            )

    remaining = count - assigned_new
    if remaining <= 0:
        return assigned_new

    desired_recycle = max(target_recycle, remaining)
    assigned_recycle = create_recycled_assignments(agent, desired_recycle)

    return assigned_new + assigned_recycle
