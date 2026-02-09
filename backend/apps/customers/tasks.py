import os
import pandas as pd
from celery import shared_task
from django.db import transaction
from .models import Customer
from apps.sales.models import SalesAssignment

@shared_task
def task_process_large_excel(file_path, user_id):
    """대용량 엑셀 업로드 -> 고객 생성 -> 영업 배정 생성"""
    total_created = 0
    engine = 'openpyxl' if file_path.endswith('.xlsx') else 'xlrd'
    CHUNK_SIZE = 5000 

    try:
        try:
            chunks = pd.read_excel(file_path, engine=engine, chunksize=CHUNK_SIZE)
        except TypeError:
            # 일부 pandas 버전은 read_excel에 chunksize 미지원
            chunks = [pd.read_excel(file_path, engine=engine)]

        for chunk_df in chunks:
            chunk_df = chunk_df.where(pd.notnull(chunk_df), None)
            
            # 1. 데이터 전처리
            customer_objs = []
            phones_in_batch = []
            
            for _, row in chunk_df.iterrows():
                try:
                    data = _extract_data(row) # 아래 헬퍼 함수 사용
                    if not data: continue
                    
                    phones_in_batch.append(data['phone'])
                    customer_objs.append(Customer(
                        name=data['name'] or data['phone'],
                        phone=data['phone'],
                        category_1=data['category_1'],
                        category_2=data['category_2'],
                        category_3=data['category_3'],
                        region=data['region'],
                        region_1=data['region_1'],
                        region_2=data['region_2'],
                    ))
                except Exception: pass

            if not customer_objs: continue

            with transaction.atomic():
                # 2. 고객 DB 저장 (중복 무시)
                Customer.objects.bulk_create(customer_objs, ignore_conflicts=True)
                
                # 3. 방금 저장된(혹은 이미 있던) 고객들의 ID 조회
                saved_customers = Customer.objects.filter(phone__in=phones_in_batch)
                
                # 4. 영업 배정(SalesAssignment) 생성
                # (주의: 이미 배정 기록이 있는 고객은 중복 생성 방지 로직이 필요할 수 있으나, 
                # 일단 단순하게 신규 고객은 무조건 1차/NEW 생성으로 진행)
                assignment_objs = []
                
                # 기존에 1차 진행중인 건이 없는지 확인 (선택사항 - 속도 위해 생략 가능)
                # 여기서는 '무조건 생성' 하되, 기존 고객 재유입일 수 있으므로 생성함.
                
                for cust in saved_customers:
                    assignment_objs.append(SalesAssignment(
                        customer=cust,
                        stage='1ST',   # 1차 영업
                        status='NEW',  # 대기 상태
                        agent=None     # 아직 담당자 없음
                    ))
                
                SalesAssignment.objects.bulk_create(assignment_objs)
                total_created += len(assignment_objs)

    except Exception as e:
        print(f"❌ 업로드 실패: {e}")
    finally:
        if os.path.exists(file_path): os.remove(file_path)

    return f"완료: 약 {total_created}건 업로드 및 배정 생성"

def _extract_data(row):
    # 엑셀 컬럼 매핑 (기존 로직 유지)
    COLUMN_MAPPING = {
    'name': ['이름', '회사명', '사찰명', '상호명', '대표자', '성명'], 
    'phone': ['전화번호', '휴대폰', '연락처', 'Tel', 'Phone'],
    'category_1': ['분야1', '업종', '업태'], 
    'category_2': ['분야2', '주생산품', '종목'],
    'category_3': ['분야3'],
    'region_1': ['지역1', '시도'],
    'region_2': ['지역2', '시군구'],
}
    
    data = {}
    for key, candidates in COLUMN_MAPPING.items():
        val = None
        for col in candidates:
            if col in row and row[col]:
                val = str(row[col]).strip()
                break
        data[key] = val

    region_parts = [data.get('region_1'), data.get('region_2')]
    data['region'] = " ".join([p for p in region_parts if p]) or None
    
    # 필수값 체크
    if not data['phone']: return None
    return data
