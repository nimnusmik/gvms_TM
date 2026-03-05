# apps/customers/management/commands/run_auto_assign.py

from django.core.management.base import BaseCommand
from apps.sales.tasks import task_run_auto_assign

class Command(BaseCommand):
    help = '자동 배정 Celery 태스크를 즉시 실행합니다.'

    def handle(self, *args, **options):
        self.stdout.write("⏳ [자동 배정 시작]")
        result = task_run_auto_assign(triggered_by='MANAGEMENT_COMMAND')
        self.stdout.write(self.style.SUCCESS(f"✅ [완료] {result}"))