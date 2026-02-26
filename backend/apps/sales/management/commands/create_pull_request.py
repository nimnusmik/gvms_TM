from django.core.management.base import BaseCommand, CommandError
from apps.agents.models import Agent
from apps.sales.models import SalesPullRequest


class Command(BaseCommand):
    help = '상담원 대신 DB 땡겨오기 요청(PENDING)을 생성합니다.'

    def add_arguments(self, parser):
        parser.add_argument('agent_id', type=str, help='Agent ID (UUID)')
        parser.add_argument('--count', type=int, default=30, help='요청 수량 (기본 30)')
        parser.add_argument('--note', type=str, default='', help='요청 사유 메모')

    def handle(self, *args, **options):
        agent_id = options['agent_id']
        count = options['count']
        note = options['note'] or ''

        if count <= 0:
            raise CommandError('count는 1 이상이어야 합니다.')

        try:
            agent = Agent.objects.get(pk=agent_id)
        except Agent.DoesNotExist as exc:
            raise CommandError(f'Agent not found: {agent_id}') from exc

        pull_request = SalesPullRequest.objects.create(
            agent=agent,
            requested_count=count,
            request_note=note,
            status=SalesPullRequest.Status.PENDING,
        )

        self.stdout.write(self.style.SUCCESS(
            f"✅ 생성됨: request_id={pull_request.id}, agent_id={agent_id}, count={count}"
        ))
