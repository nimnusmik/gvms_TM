from datetime import datetime, date, time, timedelta
import pytz

from django.conf import settings
from django.db import IntegrityError, transaction
from django.db.models import Count, Q
from django.db.models.functions import TruncDate, TruncWeek
from django.utils import timezone
from django.http import HttpResponse
from rest_framework import viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.agents.models import Agent
from apps.agents.permissions import IsAdminOrManager
from apps.calls.models import CallLog

from .models import Settlement, SettlementPrice, SettlementStatus, SettlementViewType
from .serializers import SettlementRowSerializer, SettlementUpdateSerializer


RESULT_TYPES = ['SUCCESS', 'REJECT', 'INVALID', 'ABSENCE']


def _parse_date(value):
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError:
        raise ValidationError({"detail": "날짜 형식이 올바르지 않습니다. (YYYY-MM-DD)"})


def _get_date_range(request):
    start = _parse_date(request.query_params.get('start_date'))
    end = _parse_date(request.query_params.get('end_date'))

    today = timezone.localtime().date()
    if end is None:
        end = today
    if start is None:
        start = end - timedelta(days=6)

    if start > end:
        start, end = end, start
    return start, end


def _get_kst_range(start_date: date, end_date: date):
    kst = pytz.timezone('Asia/Seoul')
    start_dt = kst.localize(datetime.combine(start_date, time.min))
    end_dt = kst.localize(datetime.combine(end_date, time.max))
    if settings.USE_TZ:
        start_dt = start_dt.astimezone(pytz.UTC)
        end_dt = end_dt.astimezone(pytz.UTC)
    return start_dt, end_dt, kst


def _get_prices():
    price = SettlementPrice.objects.order_by('-created_at').first()
    if not price:
        price = SettlementPrice.objects.create(success_price=2000, reject_price=700, invalid_price=0)
    return price


class SettlementViewSet(viewsets.GenericViewSet):
    queryset = Settlement.objects.all()
    permission_classes = [IsAdminOrManager]
    http_method_names = ['get', 'patch', 'head', 'options']

    def get_serializer_class(self):
        if self.action in ['partial_update']:
            return SettlementUpdateSerializer
        return SettlementRowSerializer

    def _get_agents(self, request):
        agent_ids = request.query_params.get('agent_ids')
        agents = Agent.objects.select_related('user').all()
        if agent_ids:
            ids = [value for value in agent_ids.split(',') if value]
            if ids:
                agents = agents.filter(agent_id__in=ids)
        return agents

    def _sync_settlements(self, agents, range_start, range_end):
        if not agents.exists():
            return {}
        price = _get_prices()
        start_dt, end_dt, _ = _get_kst_range(range_start, range_end)
        qs = CallLog.objects.filter(
            call_start__range=(start_dt, end_dt),
            is_billable=True,
            result_type__in=RESULT_TYPES,
            agent__in=agents,
        )
        aggregated = qs.values('agent_id').annotate(
            success_count=Count('id', filter=Q(result_type='SUCCESS')),
            reject_count=Count('id', filter=Q(result_type='REJECT')),
            invalid_count=Count('id', filter=Q(result_type='INVALID')),
            absence_count=Count('id', filter=Q(result_type='ABSENCE')),
        )
        stats_map = {row['agent_id']: row for row in aggregated}

        settlements = []
        for agent in agents:
            row = stats_map.get(agent.agent_id, {})
            success = row.get('success_count', 0) or 0
            reject = row.get('reject_count', 0) or 0
            invalid = row.get('invalid_count', 0) or 0
            absence = row.get('absence_count', 0) or 0
            calculated = success * price.success_price + reject * price.reject_price + invalid * price.invalid_price

            defaults = {
                'status': SettlementStatus.PENDING,
                'success_count': success,
                'reject_count': reject,
                'invalid_count': invalid,
                'absence_count': absence,
                'calculated_amount': calculated,
            }

            try:
                with transaction.atomic():
                    settlement, _ = Settlement.objects.update_or_create(
                        agent=agent,
                        period_start=range_start,
                        period_end=range_end,
                        view_type=SettlementViewType.RANGE,
                        defaults=defaults,
                    )
            except IntegrityError:
                settlement = Settlement.objects.get(
                    agent=agent,
                    period_start=range_start,
                    period_end=range_end,
                    view_type=SettlementViewType.RANGE,
                )
                settlement.success_count = success
                settlement.reject_count = reject
                settlement.invalid_count = invalid
                settlement.absence_count = absence
                settlement.calculated_amount = calculated
                settlement.save(update_fields=[
                    'success_count',
                    'reject_count',
                    'invalid_count',
                    'absence_count',
                    'calculated_amount',
                    'updated_at',
                ])

            settlements.append(settlement)

        return {s.agent_id: s for s in settlements}

    @action(detail=False, methods=['get'])
    def summary(self, request):
        range_start, range_end = _get_date_range(request)
        view = (request.query_params.get('view') or 'day').lower()
        if view not in ['day', 'week']:
            view = 'day'

        agents = self._get_agents(request)
        self._sync_settlements(agents, range_start, range_end)

        price = _get_prices()
        start_dt, end_dt, _ = _get_kst_range(range_start, range_end)
        qs = CallLog.objects.filter(
            call_start__range=(start_dt, end_dt),
            is_billable=True,
            result_type__in=RESULT_TYPES,
            agent__in=agents,
        )

        total_counts = qs.aggregate(
            success=Count('id', filter=Q(result_type='SUCCESS')),
            reject=Count('id', filter=Q(result_type='REJECT')),
            invalid=Count('id', filter=Q(result_type='INVALID')),
            absence=Count('id', filter=Q(result_type='ABSENCE')),
        )
        total_success = total_counts.get('success', 0) or 0
        total_reject = total_counts.get('reject', 0) or 0
        total_invalid = total_counts.get('invalid', 0) or 0
        total_absence = total_counts.get('absence', 0) or 0
        billable_count = total_success + total_reject + total_invalid + total_absence
        total_amount = total_success * price.success_price + total_reject * price.reject_price + total_invalid * price.invalid_price
        avg_unit_price = round(total_amount / billable_count, 2) if billable_count > 0 else 0

        pending_settlements = Settlement.objects.filter(
            agent__in=agents,
            period_start=range_start,
            period_end=range_end,
            view_type=SettlementViewType.RANGE,
            status=SettlementStatus.PENDING,
        )
        pending_amount = 0
        for settlement in pending_settlements:
            pending_amount += settlement.final_amount if settlement.final_amount is not None else settlement.calculated_amount

        chart = []
        if view == 'day':
            rows = qs.annotate(day=TruncDate('call_start')).values('day').annotate(
                success=Count('id', filter=Q(result_type='SUCCESS')),
                reject=Count('id', filter=Q(result_type='REJECT')),
                invalid=Count('id', filter=Q(result_type='INVALID')),
                absence=Count('id', filter=Q(result_type='ABSENCE')),
            ).order_by('day')
            by_day = {row['day']: row for row in rows}
            cursor = range_start
            while cursor <= range_end:
                row = by_day.get(cursor, {})
                success = row.get('success', 0) or 0
                reject = row.get('reject', 0) or 0
                invalid = row.get('invalid', 0) or 0
                absence = row.get('absence', 0) or 0
                amount = success * price.success_price + reject * price.reject_price + invalid * price.invalid_price
                chart.append({
                    'label': cursor.strftime('%m/%d'),
                    'success_count': success,
                    'reject_count': reject,
                    'invalid_count': invalid,
                    'absence_count': absence,
                    'amount': amount,
                })
                cursor += timedelta(days=1)
        else:
            rows = qs.annotate(week=TruncWeek('call_start')).values('week').annotate(
                success=Count('id', filter=Q(result_type='SUCCESS')),
                reject=Count('id', filter=Q(result_type='REJECT')),
                invalid=Count('id', filter=Q(result_type='INVALID')),
                absence=Count('id', filter=Q(result_type='ABSENCE')),
            ).order_by('week')
            by_week = {row['week']: row for row in rows}

            cursor = range_start
            # align to Monday
            cursor -= timedelta(days=cursor.weekday())
            while cursor <= range_end:
                week_start = max(cursor, range_start)
                week_end = min(cursor + timedelta(days=6), range_end)
                row = by_week.get(cursor, {})
                success = row.get('success', 0) or 0
                reject = row.get('reject', 0) or 0
                invalid = row.get('invalid', 0) or 0
                absence = row.get('absence', 0) or 0
                amount = success * price.success_price + reject * price.reject_price + invalid * price.invalid_price
                chart.append({
                    'label': f"{week_start.strftime('%m/%d')}~{week_end.strftime('%m/%d')}",
                    'success_count': success,
                    'reject_count': reject,
                    'invalid_count': invalid,
                    'absence_count': absence,
                    'amount': amount,
                })
                cursor += timedelta(days=7)

        return Response({
            'cards': {
                'total_amount': total_amount,
                'avg_unit_price': avg_unit_price,
                'billable_count': billable_count,
                'pending_amount': pending_amount,
            },
            'chart': chart,
        })

    @action(detail=False, methods=['get'])
    def rows(self, request):
        range_start, range_end = _get_date_range(request)
        agents = self._get_agents(request)
        self._sync_settlements(agents, range_start, range_end)

        qs = Settlement.objects.filter(
            agent__in=agents,
            period_start=range_start,
            period_end=range_end,
            view_type=SettlementViewType.RANGE,
        ).select_related('agent', 'agent__user').order_by('agent__user__name')

        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = SettlementRowSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = SettlementRowSerializer(qs, many=True)
        return Response(serializer.data)

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = SettlementUpdateSerializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(SettlementRowSerializer(instance).data)

    @action(detail=False, methods=['get'])
    def export(self, request):
        from openpyxl import Workbook

        range_start, range_end = _get_date_range(request)
        agents = self._get_agents(request)
        self._sync_settlements(agents, range_start, range_end)

        qs = Settlement.objects.filter(
            agent__in=agents,
            period_start=range_start,
            period_end=range_end,
            view_type=SettlementViewType.RANGE,
        ).select_related('agent', 'agent__user').order_by('agent__user__name')

        wb = Workbook()
        ws = wb.active
        ws.title = 'Settlements'
        ws.append([
            '상담원명',
            'SUCCESS',
            'REJECT',
            'INVALID',
            'ABSENCE',
            '정산건수',
            '산정금액',
            '최종정산액',
            '상태',
            '비고',
        ])
        for row in qs:
            ws.append([
                row.agent.user.name if row.agent and row.agent.user else '',
                row.success_count,
                row.reject_count,
                row.invalid_count,
                row.absence_count,
                row.success_count + row.reject_count + row.invalid_count + row.absence_count,
                row.calculated_amount,
                row.final_amount if row.final_amount is not None else row.calculated_amount,
                row.get_status_display(),
                row.note,
            ])

        response = HttpResponse(
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        filename = f"settlements_{range_start.strftime('%Y_%m_%d')}_{range_end.strftime('%Y_%m_%d')}.xlsx"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        wb.save(response)
        return response
