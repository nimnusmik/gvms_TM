import os
import pandas as pd
from django.conf import settings
from django.db import transaction 
from rest_framework import viewsets, status, parsers
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Customer
from .serializers import CustomerSerializer, FileUploadSerializer
from .tasks import process_excel_upload
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile

class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    
    @action(detail=False, methods=['POST'], parser_classes=[parsers.MultiPartParser])
    def upload_excel(self, request):
        serializer = FileUploadSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        file = request.FILES['file']
        
        try:
            df = pd.read_excel(file)
            
            # Pandas의 NaN을 파이썬의 None으로 싹 바꿔줍니다. (DB 에러 방지)
            df = df.where(pd.notnull(df), None)

            # 필수 컬럼 확인
            required_cols = ['이름', '전화번호']
            if not all(col in df.columns for col in required_cols):
                return Response(
                    {"error": f"필수 컬럼 누락: {', '.join(required_cols)}"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            customers_to_create = []
            for _, row in df.iterrows():
                # 전화번호 전처리
                raw_phone = str(row['전화번호']) if row['전화번호'] else ""
                phone = raw_phone.replace('-', '').strip()
                
                # 유효성 검사 (전화번호 없으면 스킵하는게 안전)
                if not phone: 
                    continue

                customers_to_create.append(Customer(
                    name=row['이름'],
                    phone=phone,
                    age=row.get('나이'),     # 이제 NaN 대신 None이 들어와서 안전함
                    gender=row.get('성별'),
                    region=row.get('지역'),
                    status=Customer.Status.NEW
                ))


            with transaction.atomic():
                Customer.objects.bulk_create(
                    customers_to_create, 
                    batch_size=1000,       # 1000개씩 끊어서 저장 (메모리/DB 보호)
                    ignore_conflicts=True  # 중복 무시
                )

            return Response(
                {"message": f"총 {len(customers_to_create)}건의 데이터 처리가 완료되었습니다."}, 
                status=status.HTTP_201_CREATED
            )

        except Exception as e:
            print(f"엑셀 업로드 실패: {e}")
            return Response({"error": "데이터 처리 중 오류가 발생했습니다."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    
    @action(detail=False, methods=['POST'])
    def upload_excel(self, request):
        file = request.FILES.get('file')
        if not file:
             return Response({"error": "파일이 없습니다."}, status=400)

        # 1. 파일 저장 (Celery가 읽을 수 있게 공유 폴더에 저장)
        # 파일 이름이 겹치지 않게 저장하는 것이 좋습니다.
        file_path = default_storage.save(f"temp/{file.name}", ContentFile(file.read()))
        
        # 실제 물리적 경로 (Docker Volume 경로)
        full_path = os.path.join(settings.MEDIA_ROOT, file_path)

        # 2. Celery에게 "이 경로에 있는 파일 처리해!" 라고 지시 (비동기)
        # .delay()를 쓰면 기다리지 않고 Task ID만 툭 던져주고 바로 넘어갑니다.
        task = process_excel_upload.delay(full_path)

        # 3. 사용자에게는 "접수 완료" 응답
        return Response({
            "message": "업로드가 시작되었습니다. 잠시 후 새로고침 해주세요.",
            "task_id": task.id
        }, status=status.HTTP_202_ACCEPTED)