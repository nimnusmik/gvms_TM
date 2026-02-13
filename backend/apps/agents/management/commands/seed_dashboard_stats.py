import random
from datetime import datetime, timedelta

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from apps.agents.models import Agent
from apps.calls.models import CallLog
from apps.customers.models import Customer
from apps.sales.models import SalesAssignment


class Command(BaseCommand):
    help = "대시보드/성과분석 차트 확인용 더미 영업/통화 데이터를 생성합니다."

    def add_arguments(self, parser):
        parser.add_argument(
            "--agents",
            type=int,
            default=4,
            help="데이터를 생성할 상담원 수 (기본 4명)",
        )
        parser.add_argument(
            "--days",
            type=int,
            default=7,
            help="최근 몇 일치 데이터를 만들지 (기본 7일)",
        )
        parser.add_argument(
            "--min-calls",
            type=int,
            default=120,
            help="상담원/일 최소 통화 건수",
        )
        parser.add_argument(
            "--max-calls",
            type=int,
            default=200,
            help="상담원/일 최대 통화 건수",
        )
        parser.add_argument(
            "--seed",
            type=int,
            default=None,
            help="난수 시드 (재현 가능한 결과가 필요할 때 사용)",
        )

    def handle(self, *args, **options):
        if options["min_calls"] > options["max_calls"]:
            raise CommandError("--min-calls 값은 --max-calls보다 클 수 없습니다.")

        if options["seed"] is not None:
            random.seed(options["seed"])

        agent_limit = options["agents"]
        agents = list(Agent.objects.order_by("created_at")[:agent_limit])
        if len(agents) < agent_limit:
            raise CommandError(
                f"요청한 {agent_limit}명보다 상담원이 적습니다. 현재: {len(agents)}명"
            )

        today = timezone.localtime().date()
        days = options["days"]
        tz = timezone.get_current_timezone()

        categories = ["보험", "렌탈", "교육", "헬스케어", "통신"]
        regions = ["서울", "경기", "인천", "부산", "대구", "대전"]
        items = ["프리미엄 플랜", "베이직 패키지", "패밀리 플랜", "비즈니스 플랜"]
        sentiments = [
            SalesAssignment.Sentiment.HIGH,
            SalesAssignment.Sentiment.MID,
            SalesAssignment.Sentiment.LOW,
        ]
        results = [
            (CallLog.Result.SUCCESS, SalesAssignment.Status.SUCCESS, 4),
            (CallLog.Result.REJECT, SalesAssignment.Status.REJECT, 3),
            (CallLog.Result.ABSENCE, SalesAssignment.Status.TRYING, 2),
            (CallLog.Result.INVALID, SalesAssignment.Status.INVALID, 1),
        ]

        created_assignments = 0
        created_calls = 0
        created_customers = 0

        with transaction.atomic():
            for day_offset in range(days):
                target_date = today - timedelta(days=(days - 1 - day_offset))
                for agent in agents:
                    call_count = random.randint(
                        options["min_calls"], options["max_calls"]
                    )

                    for call_index in range(call_count):
                        phone = self._generate_unique_phone()
                        customer = Customer.objects.create(
                            name=f"테스트고객 {agent.user.name} {target_date:%m%d}-{call_index + 1}",
                            phone=phone,
                            age=random.randint(20, 65),
                            gender=random.choice(["M", "F"]),
                            region=random.choice(regions),
                            category_1=random.choice(categories),
                            region_1=random.choice(regions),
                        )
                        created_customers += 1

                        result_type, status, _ = random.choices(
                            results, weights=[r[2] for r in results], k=1
                        )[0]

                        assignment = SalesAssignment.objects.create(
                            customer=customer,
                            agent=agent,
                            stage=SalesAssignment.Stage.FIRST,
                            status=status,
                            sentiment=random.choice(sentiments),
                            item_interested=random.choice(items),
                            memo="대시보드/성과 분석 확인용 시드 데이터",
                        )
                        created_assignments += 1

                        call_start = datetime.combine(
                            target_date,
                            datetime.min.time(),
                        ).replace(
                            hour=random.randint(9, 19),
                            minute=random.randint(0, 59),
                            second=random.randint(0, 59),
                        )
                        call_start = timezone.make_aware(call_start, tz)

                        CallLog.objects.create(
                            assignment=assignment,
                            agent=agent,
                            call_start=call_start,
                            call_duration=random.randint(30, 600),
                            result_type=result_type,
                            is_billable=True,
                        )
                        created_calls += 1

        self.stdout.write(
            self.style.SUCCESS(
                "✅ 시드 완료 - 상담원:{agents}명 / 기간:{days}일 / 고객:{customers}명 / 배정:{assignments}건 / 통화:{calls}건".format(
                    agents=len(agents),
                    days=days,
                    customers=created_customers,
                    assignments=created_assignments,
                    calls=created_calls,
                )
            )
        )

    def _generate_unique_phone(self):
        while True:
            phone = "010" + "".join(random.choices("0123456789", k=8))
            if not Customer.objects.filter(phone=phone).exists():
                return phone
