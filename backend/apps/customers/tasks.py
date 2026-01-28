import pandas as pd
import os
from celery import shared_task
from django.db import transaction
from .models import Customer

@shared_task
def process_excel_upload(file_path):
    """
    Celery가 백그라운드에서 실행하는 함수입니다.
    views.py에서 넘겨준 파일 경로(file_path)를 받아서 처리합니다.
    """
    try:
        print(f"🔥 [Celery] 엑셀 처리 시작: {file_path}")
        
        # 1. Pandas로 엑셀 읽기
        df = pd.read_excel(file_path)
        
        # 2. ✨ 사라졌던 로직 복구: NaN -> None 변환
        df = df.where(pd.notnull(df), None)

        # 3. 필수 컬럼 확인
        required_cols = ['이름', '전화번호']
        # (Task에서는 Response를 못 주므로, 에러 발생 시 로그를 남기고 종료하거나 상태를 업데이트해야 함)
        if not all(col in df.columns for col in required_cols):
            print(f"❌ [Celery] 필수 컬럼 누락: {required_cols}")
            return "실패: 필수 컬럼 누락"

        # 4. 데이터 객체 생성 (반복문)
        customers_to_create = []
        for _, row in df.iterrows():
            # 전화번호 전처리
            raw_phone = str(row['전화번호']) if row['전화번호'] else ""
            phone = raw_phone.replace('-', '').strip()
            
            # 유효성 검사
            if not phone: 
                continue

            customers_to_create.append(Customer(
                name=row['이름'],
                phone=phone,
                age=row.get('나이'),     # None 안전하게 들어감
                gender=row.get('성별'),
                region=row.get('지역'),
                status=Customer.Status.NEW
            ))

        # 5. DB 저장 (Bulk Create)
        with transaction.atomic():
            Customer.objects.bulk_create(
                customers_to_create, 
                batch_size=1000,       
                ignore_conflicts=True 
            )
            
        print(f"✅ [Celery] {len(customers_to_create)}건 업로드 완료!")
        
        # 6. (선택사항) 다 쓴 임시 파일 삭제
        if os.path.exists(file_path):
            os.remove(file_path)
            
        return f"성공: {len(customers_to_create)}건 처리"

    except Exception as e:
        print(f"❌ [Celery] 에러 발생: {str(e)}")
        return f"실패: {str(e)}"