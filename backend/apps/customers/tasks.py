import os
import pandas as pd
import logging
from celery import shared_task
from django.db import transaction
from .models import Customer
from apps.sales.models import SalesAssignment

COLUMN_MAPPING = {
    'name': ['이름', '회사명', '사찰명', '상호명', '대표자', '성명'],
    'phone': ['전화번호', '휴대폰', '연락처', 'Tel', 'Phone'],
    'category_1': ['분야1', '업종', '업태'],
    'category_2': ['분야2', '주생산품', '종목'],
    'category_3': ['분야3'],
    'region_1': ['지역1', '시도'],
    'region_2': ['지역2', '시군구'],
}

logger = logging.getLogger(__name__)

@shared_task
def task_process_large_excel(file_path, user_id):
    """대용량 엑셀 업로드 -> 고객 생성 -> 영업 배정 생성"""
    total_created = 0
    engine = 'openpyxl' if file_path.endswith('.xlsx') else 'xlrd'
    CHUNK_SIZE = 5000 

    try:
        try:
            header_row = _detect_header_row(file_path, engine)
            logger.info("excel header_row=%s file=%s", header_row, file_path)
            chunks = pd.read_excel(
                file_path,
                engine=engine,
                chunksize=CHUNK_SIZE,
                header=header_row,
            )
        except TypeError:
            # 일부 pandas 버전은 read_excel에 chunksize 미지원
            header_row = _detect_header_row(file_path, engine)
            logger.info("excel header_row=%s file=%s (no chunksize)", header_row, file_path)
            chunks = [pd.read_excel(file_path, engine=engine, header=header_row)]

        for chunk_idx, chunk_df in enumerate(chunks):
            chunk_df = chunk_df.where(pd.notnull(chunk_df), None)
            logger.info("excel chunk=%s rows=%s cols=%s", chunk_idx, len(chunk_df), list(chunk_df.columns))
            
            # 1. 데이터 전처리
            customer_objs = []
            phones_in_batch = set()
            
            col_index = _build_col_index(chunk_df.columns)

            for row in chunk_df.itertuples(index=False, name=None):
                try:
                    data = _extract_data(row, col_index) # 아래 헬퍼 함수 사용
                    if not data: continue
                    
                    phones_in_batch.add(data['phone'])
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

            if not customer_objs:
                logger.info(
                    "excel chunk=%s no valid rows (phones=%s)", chunk_idx, len(phones_in_batch)
                )
                continue

            with transaction.atomic():
                # 2. 고객 DB 저장 (중복 무시)
                Customer.objects.bulk_create(customer_objs, ignore_conflicts=True)
                
                # 3. 방금 저장된(혹은 이미 있던) 고객들의 ID 조회
                saved_customers = Customer.objects.filter(phone__in=phones_in_batch)
                logger.info(
                    "excel chunk=%s phones=%s saved_customers=%s",
                    chunk_idx,
                    len(phones_in_batch),
                    saved_customers.count(),
                )

                # 4. 영업 배정(SalesAssignment) 생성
                # (주의: 이미 배정 기록이 있는 고객은 중복 생성 방지 로직이 필요할 수 있으나, 
                # 일단 단순하게 신규 고객은 무조건 1차/NEW 생성으로 진행)
                assignment_objs = []

                active_customer_ids = set(
                    SalesAssignment.objects.filter(
                        customer_id__in=saved_customers.values_list('id', flat=True),
                        stage=SalesAssignment.Stage.FIRST,
                        status__in=[
                            SalesAssignment.Status.NEW,
                            SalesAssignment.Status.ASSIGNED,
                            SalesAssignment.Status.TRYING,
                        ],
                    ).values_list('customer_id', flat=True)
                )
                logger.info(
                    "excel chunk=%s active_assignments=%s",
                    chunk_idx,
                    len(active_customer_ids),
                )

                for cust in saved_customers:
                    if cust.id in active_customer_ids:
                        continue
                    assignment_objs.append(SalesAssignment(
                        customer=cust,
                        stage=SalesAssignment.Stage.FIRST,
                        status=SalesAssignment.Status.NEW,
                        agent=None     # 아직 담당자 없음
                    ))
                
                SalesAssignment.objects.bulk_create(assignment_objs)
                logger.info(
                    "excel chunk=%s assignments_created=%s",
                    chunk_idx,
                    len(assignment_objs),
                )
                total_created += len(assignment_objs)

    except Exception as e:
        print(f"❌ 업로드 실패: {e}")
    finally:
        if os.path.exists(file_path): os.remove(file_path)

    return f"완료: 약 {total_created}건 업로드 및 배정 생성"

def _normalize_col(value):
    if not isinstance(value, str):
        return value
    return value.replace("\ufeff", "").replace("\u00a0", " ").strip()


def _detect_header_row(file_path, engine, max_rows=5):
    try:
        preview = pd.read_excel(file_path, engine=engine, header=None, nrows=max_rows)
    except Exception:
        return 0

    candidates = {_normalize_col(c) for c in COLUMN_MAPPING['phone']}
    for idx, row in preview.iterrows():
        for cell in row.values:
            if _normalize_col(cell) in candidates:
                return idx
    return 0


def _build_col_index(columns):
    col_index = {}
    for idx, col in enumerate(columns):
        normalized = _normalize_col(col)
        col_index[col] = idx
        col_index[normalized] = idx
    return col_index


def _extract_data(row, col_index):
    data = {}
    for key, candidates in COLUMN_MAPPING.items():
        val = None
        for col in candidates:
            idx = col_index.get(col)
            if idx is None:
                idx = col_index.get(_normalize_col(col))
            if idx is not None:
                cell = row[idx]
                if cell is not None:
                    text = str(cell).strip()
                    if text:
                        val = text
                break
        data[key] = val

    region_parts = [data.get('region_1'), data.get('region_2')]
    data['region'] = " ".join([p for p in region_parts if p]) or None
    
    # 필수값 체크
    if not data['phone']: return None

    # 길이 제한 방어 (DB 컬럼 max_length)
    data['name'] = _truncate(data.get('name'), 100)
    data['phone'] = _truncate(data.get('phone'), 20)
    data['category_1'] = _truncate(data.get('category_1'), 50)
    data['category_2'] = _truncate(data.get('category_2'), 50)
    data['category_3'] = _truncate(data.get('category_3'), 50)
    data['region_1'] = _truncate(data.get('region_1'), 50)
    data['region_2'] = _truncate(data.get('region_2'), 50)
    data['region'] = _truncate(data.get('region'), 255)
    return data


def _truncate(value, max_len):
    if value is None:
        return None
    text = str(value).strip()
    if not text:
        return None
    if len(text) <= max_len:
        return text
    return text[:max_len]
