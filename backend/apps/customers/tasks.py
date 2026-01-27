import os
import pandas as pd
from celery import shared_task
from django.db import transaction
from .models import Customer

@shared_task
def process_excel_upload(file_path):
    """
    백그라운드에서 엑셀 파일을 읽어 DB에 저장하는 Task
    """
    try:
        # 1. 파일 읽기 (경로에서 읽음)
        df = pd.read_excel(file_path)
        df = df.where(pd.notnull(df), None) # NaN 처리

        customers_to_create = []
        for _, row in df.iterrows():
            raw_phone = str(row.get('전화번호', ''))
            phone = raw_phone.replace('-', '').strip()
            
            if not phone: continue

            customers_to_create.append(Customer(
                name=row.get('이름'),
                phone=phone,
                age=row.get('나이'),
                gender=row.get('성별'),
                region=row.get('지역'),
                status='NEW'
            ))

        # 2. 대량 저장
        with transaction.atomic():
            Customer.objects.bulk_create(
                customers_to_create, 
                batch_size=1000, 
                ignore_conflicts=True
            )
        
        return f"성공: {len(customers_to_create)}건 저장 완료"

    except Exception as e:
        return f"실패: {str(e)}"
    
    finally:
        # 3. 중요: 처리가 끝난 임시 파일은 반드시 삭제해야 서버 용량이 안 찹니다.
        if os.path.exists(file_path):
            os.remove(file_path)