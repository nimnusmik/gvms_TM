from django.shortcuts import render
# Create your views here.
from rest_framework import viewsets, permissions
from django.db import transaction
from .models import CallLog
from .serializers import CallLogSerializer
from apps.sales.models import SalesAssignment

class CallLogViewSet(viewsets.ModelViewSet):
    queryset = CallLog.objects.all()
    serializer_class = CallLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        """
        통화 기록 저장 시, 영업 배정 상태(Assignment Status)를 자동으로 업데이트하는 로직
        """
        user = self.request.user
        agent = getattr(user, 'agent_profile', None)
        
        # 1. 배정 건(Assignment) 가져오기
        assignment = serializer.validated_data['assignment']
        call_result = serializer.validated_data.get('result')

        # 2. 변경 전 상태 기록 (Before)
        status_before = assignment.status
        status_after = status_before # 기본값은 유지

        # 3. 통화 결과에 따른 상태 자동 변경 로직 🤖
        with transaction.atomic():
            if call_result == CallLog.Result.SUCCESS:
                # 통화 성공(동의) -> 영업 성공!
                status_after = SalesAssignment.Status.SUCCESS
            
            elif call_result == CallLog.Result.REJECT:
                # 거절 -> 영업 거절 (재활용 대상)
                status_after = SalesAssignment.Status.REJECT
            
            elif call_result == CallLog.Result.WRONG_NUMBER:
                # 결번 -> 무효 처리
                status_after = SalesAssignment.Status.INVALID
            
            elif call_result in [CallLog.Result.ABSENCE, CallLog.Result.BUSY, CallLog.Result.LATER]:
                # 부재/통화중 -> 계속 시도 중(TRYING)으로 변경 (단, 이미 성공한 건은 건드리지 않음)
                if status_before not in ['SUCCESS', 'REJECT']:
                    status_after = SalesAssignment.Status.TRYING

            # 4. 상태가 변했다면 Assignment 업데이트
            if status_before != status_after:
                assignment.status = status_after
                assignment.save()

            # 5. CallLog 저장 (Before/After 꼬리표 붙여서)
            serializer.save(
                agent=agent,
                status_before=status_before,
                status_after=status_after
            )