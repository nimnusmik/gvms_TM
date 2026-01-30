# apps/customers/management/commands/run_auto_assign.py

from django.core.management.base import BaseCommand
from apps.customers.services import distribute_customers

class Command(BaseCommand):
    help = '매일 50개씩 신규 고객을 상담원에게 자동 배정합니다.'

    def add_arguments(self, parser):
        # 원하면 터미널에서 개수를 바꿀 수 있게 옵션 추가 (기본 50개)
        parser.add_argument('--limit', type=int, default=50, help='배정할 고객 수')

    def handle(self, *args, **options):
        limit = options['limit']
        self.stdout.write(f"⏳ [자동 배정 시작] 목표: {limit}건")
        
        # 서비스 로직 실행!
        result_message = distribute_customers(limit=limit)
        
        self.stdout.write(self.style.SUCCESS(f"✅ [완료] {result_message}"))