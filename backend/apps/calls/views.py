from django.shortcuts import render
# Create your views here.
import os
import uuid
import boto3
from django.utils import timezone
from django.conf import settings
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from .models import CallLog
from .serializers import CallLogSerializer
from apps.sales.models import SalesAssignment
from apps.agents.models import AgentRole

class CallLogViewSet(viewsets.ModelViewSet):
    queryset = CallLog.objects.all()
    serializer_class = CallLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def _check_calllog_access(self, call_log, user):
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser:
            return True
        agent = getattr(user, 'agent_profile', None)
        if not agent:
            return False
        if agent.role in [AgentRole.ADMIN, AgentRole.MANAGER]:
            return True
        return call_log.agent_id == agent.agent_id

    def _get_s3_client(self):
        return boto3.client(
            "s3",
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            endpoint_url=settings.AWS_S3_ENDPOINT_URL or None,
            region_name=settings.AWS_S3_REGION_NAME,
        )

    def _require_bucket(self):
        if not settings.AWS_STORAGE_BUCKET_NAME:
            return Response({"detail": "S3 bucket is not configured"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return None

    def _build_recording_key(self, filename):
        safe_name = os.path.basename(filename or "recording")
        date_path = timezone.now().strftime("%Y/%m")
        return f"recordings/{date_path}/{uuid.uuid4().hex}_{safe_name}"

    def _validate_upload_request(self, content_type, size_bytes):
        allowed = {"audio/mpeg", "audio/wav", "audio/x-wav", "audio/mp4", "audio/aac", "audio/ogg"}
        max_size = 50 * 1024 * 1024
        if content_type not in allowed:
            return f"unsupported content_type: {content_type}"
        if size_bytes is None:
            return "size_bytes is required"
        try:
            size = int(size_bytes)
        except (TypeError, ValueError):
            return "size_bytes must be an integer"
        if size <= 0 or size > max_size:
            return f"size_bytes must be between 1 and {max_size}"
        return None

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

    @action(detail=True, methods=['post'], url_path='recording-upload')
    def recording_upload(self, request, pk=None):
        call_log = self.get_object()
        if not self._check_calllog_access(call_log, request.user):
            return Response({"detail": "forbidden"}, status=status.HTTP_403_FORBIDDEN)

        filename = request.data.get("filename")
        content_type = request.data.get("content_type")
        size_bytes = request.data.get("size_bytes")
        error = self._validate_upload_request(content_type, size_bytes)
        if error:
            return Response({"detail": error}, status=status.HTTP_400_BAD_REQUEST)
        bucket_error = self._require_bucket()
        if bucket_error:
            return bucket_error

        key = self._build_recording_key(filename)
        client = self._get_s3_client()
        upload_url = client.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": settings.AWS_STORAGE_BUCKET_NAME,
                "Key": key,
                "ContentType": content_type,
            },
            ExpiresIn=3600,
        )

        call_log.recording_file.name = key
        call_log.recording_status = "PENDING"
        call_log.recording_mime = content_type
        call_log.recording_size = int(size_bytes)
        call_log.save(update_fields=["recording_file", "recording_status", "recording_mime", "recording_size"])

        return Response(
            {
                "upload_url": upload_url,
                "key": key,
                "expires_in": 3600,
                "required_headers": {"Content-Type": content_type},
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=['post'], url_path='recording-complete')
    def recording_complete(self, request, pk=None):
        call_log = self.get_object()
        if not self._check_calllog_access(call_log, request.user):
            return Response({"detail": "forbidden"}, status=status.HTTP_403_FORBIDDEN)

        key = request.data.get("key")
        if not key or call_log.recording_file.name != key:
            return Response({"detail": "invalid key"}, status=status.HTTP_400_BAD_REQUEST)
        bucket_error = self._require_bucket()
        if bucket_error:
            return bucket_error

        client = self._get_s3_client()
        try:
            head = client.head_object(
                Bucket=settings.AWS_STORAGE_BUCKET_NAME,
                Key=key,
            )
        except Exception:
            call_log.recording_status = "FAILED"
            call_log.save(update_fields=["recording_status"])
            return Response({"detail": "object not found"}, status=status.HTTP_404_NOT_FOUND)

        call_log.recording_status = "UPLOADED"
        call_log.recording_uploaded_at = timezone.now()
        call_log.recording_size = head.get("ContentLength") or call_log.recording_size
        call_log.recording_mime = head.get("ContentType") or call_log.recording_mime
        call_log.save(
            update_fields=["recording_status", "recording_uploaded_at", "recording_size", "recording_mime"]
        )

        return Response({"status": "ok"}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], url_path='recording-url')
    def recording_url(self, request, pk=None):
        call_log = self.get_object()
        if not self._check_calllog_access(call_log, request.user):
            return Response({"detail": "forbidden"}, status=status.HTTP_403_FORBIDDEN)
        if not call_log.recording_file:
            return Response({"detail": "recording not set"}, status=status.HTTP_404_NOT_FOUND)
        bucket_error = self._require_bucket()
        if bucket_error:
            return bucket_error

        client = self._get_s3_client()
        download_url = client.generate_presigned_url(
            "get_object",
            Params={
                "Bucket": settings.AWS_STORAGE_BUCKET_NAME,
                "Key": call_log.recording_file.name,
            },
            ExpiresIn=900,
        )
        return Response({"download_url": download_url, "expires_in": 900}, status=status.HTTP_200_OK)
