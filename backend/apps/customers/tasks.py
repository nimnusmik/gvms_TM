import os
import traceback
import pandas as pd
from celery import shared_task
from django.utils import timezone
from django.db import transaction

# 모델 임포트
from .models import Customer, AssignmentLog
from apps.agents.models import Agent, AgentStatus

# 핵심 비즈니스 로직 임포트
from .services import run_auto_assign_batch_all

# ----------------------------------------------------------------
# 1. 대용량 엑셀 업로드 처리 Task
# ----------------------------------------------------------------

# ✅ 4가지 엑셀 양식을 모두 커버하는 매핑 정의
COLUMN_MAPPING = {
    'name': ['이름', '회사명', '사찰명', '상호명', '대표자', '성명'], 
    'phone': ['전화번호', '휴대폰', '연락처', 'Tel', 'Phone'],
    'category_1': ['분야1', '업종', '업태'], 
    'category_2': ['분야2', '주생산품', '종목'],
    'category_3': ['분야3'],
    'region_1': ['지역1', '시도'],
    'region_2': ['지역2', '시군구'],
}

@shared_task
def task_process_large_excel(file_path, user_id):
    """
    [Celery Task] 대용량 엑셀 파일을 청크 단위로 읽어 DB에 저장
    * DB의 unique=True 속성을 활용하여 중복을 자동 무시함 (속도 최적화)
    """
    total_created = 0
    errors = []

    engine = 'openpyxl' if file_path.endswith('.xlsx') else 'xlrd'
    CHUNK_SIZE = 5000  # 대용량 처리용 청크 사이즈

    try:
        for chunk_df in _iter_excel_chunks(file_path, engine=engine, chunk_size=CHUNK_SIZE):
            
            # 1. 데이터 전처리
            chunk_df.columns = chunk_df.columns.str.strip()
            chunk_df = chunk_df.where(pd.notnull(chunk_df), None)

            customer_batch = []
            seen_phones_in_batch = set() # 엑셀 파일 '내부'의 중복만 거르기 용도

            for _, row in chunk_df.iterrows():
                try:
                    data = _extract_customer_data(row)
                    if not data: continue

                    # 엑셀 파일 안에서 똑같은 번호가 또 나오면 건너뜀
                    if data['phone'] in seen_phones_in_batch:
                        continue
                    seen_phones_in_batch.add(data['phone'])
                    
                    # 객체 생성 (일단 리스트에 담기)
                    customer_batch.append(Customer(
                        name=data['name'],
                        phone=data['phone'], # unique=True 설정됨
                        category_1=data['category_1'],
                        category_2=data['category_2'],
                        category_3=data['category_3'],
                        region=data['region'],
                        region_1=data['region_1'],
                        region_2=data['region_2'],
                        status='NEW',
                    ))

                except Exception:
                    pass 

            # 2. 일괄 저장 (핵심 로직 변경) ⚡️
            if customer_batch:
                # ignore_conflicts=True: 
                # DB에 이미 있는 번호(중복)면 에러를 내지 않고 '조용히 무시'하고 넘어감.
                # 속도가 가장 빠름.
                Customer.objects.bulk_create(customer_batch, ignore_conflicts=True)
                
                # 주의: ignore_conflicts를 쓰면 정확히 몇 개가 저장됐는지 리턴되지 않을 수 있음
                # 하지만 성능을 위해 대략적인 배치 크기를 더함
                total_created += len(customer_batch)

            print(f"🚀 처리 중... (배치 처리 완료)")

    except Exception as e:
        print(f"❌ 엑셀 처리 실패: {e}")
        return f"Failed: {str(e)}"
        
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)

    return f"완료: 약 {total_created}건 처리됨 (중복은 자동 제외)"


# ----------------------------------------------------------------
# 2. 자동 배정 실행 Task (로그 저장 기능 포함)
# ----------------------------------------------------------------

@shared_task
def task_run_auto_assign(triggered_by='SYSTEM'):
    """
    [Celery Task] 모든 상담원을 순회하며 자동 배정 로직 실행 & 로그 저장
    """
    # 1. 로그 데이터 초기화
    log_data = {
        'triggered_by': triggered_by,
        'status': AssignmentLog.Status.SUCCESS,
        'total_assigned': 0,
        'agent_count': 0,
        'result_detail': {},   # {"김철수": 10, "이영희": 5}
        'error_message': ''
    }

    try:
        # 2. 배정 대상 상담원 조회 (온라인, 자동배정 켜진 사람만)
        # AgentStatus.ONLINE 상수를 사용하는 것이 안전합니다.
        agents = Agent.objects.select_related('user').filter(
            status=AgentStatus.ONLINE, 
            is_auto_assign=True
        )
        
        log_data['agent_count'] = agents.count()

        if log_data['agent_count'] == 0:
            # 실패라기보다는 대상이 없는 상태 (로그는 남김)
            log_data['result_detail']['info'] = "현재 온라인 상태인 자동 배정 대상 상담원이 없습니다."
        
        else:
            # 3. 전체 풀 기준으로 균등 배정 (등록순)
            # 공정성 유지용: 상담원 생성 오래된 순으로 정렬
            agents = agents.order_by('created_at')
            assigned_map = run_auto_assign_batch_all(list(agents))

            for agent in agents:
                assigned_count = assigned_map.get(agent.agent_id, 0)
                if assigned_count > 0:
                    log_data['total_assigned'] += assigned_count
                    agent_name = agent.user.name if agent.user else f"Agent_{agent.agent_id}"
                    log_data['result_detail'][agent_name] = assigned_count

            # 4. 결과 메시지 정리
            if log_data['total_assigned'] == 0:
                if 'info' not in log_data['result_detail']:
                    log_data['result_detail']['info'] = "조건에 맞는 신규 DB가 없거나, 모든 상담원의 할당량이 꽉 찼습니다."

    except Exception as e:
        # 전체 로직 에러 처리
        log_data['status'] = AssignmentLog.Status.FAILURE
        log_data['error_message'] = str(e)
        log_data['result_detail']['traceback'] = traceback.format_exc()
        print(f"❌ [Celery Error] Auto Assign Failed: {e}")

    finally:
        # 5. DB에 이력 저장 (AssignmentLog)
        # 로그 저장이 실패하면 안되므로 try-except 한 번 더 감싸기
        try:
            AssignmentLog.objects.create(
                triggered_by=log_data['triggered_by'],
                status=log_data['status'],
                total_assigned=log_data['total_assigned'],
                agent_count=log_data['agent_count'],
                result_detail=log_data['result_detail'],
                error_message=log_data['error_message']
            )
        except Exception as log_e:
            print(f"❌ 로그 저장 실패: {log_e}")

    return f"Auto Assign Finished: {log_data['status']} ({log_data['total_assigned']} assigned)"


# ----------------------------------------------------------------
# 3. 헬퍼 함수 (엑셀 데이터 추출용)
# ----------------------------------------------------------------

def _extract_customer_data(row):
    """행 데이터에서 매핑 정보를 이용해 값 추출"""
    name = _get_value(row, COLUMN_MAPPING['name'])
    raw_phone = _get_value(row, COLUMN_MAPPING['phone'])
    
    if not name or not raw_phone:
        return None
        
    # 전화번호 정제 (- 공백 제거)
    phone = str(raw_phone).replace('-', '').replace(' ', '').strip()
    
    # 분야/지역 추출
    cat1 = _get_value(row, COLUMN_MAPPING['category_1'])
    cat2 = _get_value(row, COLUMN_MAPPING['category_2'])
    cat3 = _get_value(row, COLUMN_MAPPING['category_3'])
    reg1 = _get_value(row, COLUMN_MAPPING['region_1'])
    reg2 = _get_value(row, COLUMN_MAPPING['region_2'])
    
    region = f"{reg1 or ''} {reg2 or ''}".strip()

    return {
        'name': _trim(name, 100),
        'phone': _trim(phone, 20),
        'category_1': _trim(cat1, 50),
        'category_2': _trim(cat2, 50),
        'category_3': _trim(cat3, 50),
        'region': _trim(region if region else None, 255),
        'region_1': _trim(reg1, 50),
        'region_2': _trim(reg2, 50),
    }

def _get_value(row, candidates):
    """여러 컬럼 후보 중 값이 있는 것을 반환"""
    for col in candidates:
        if col in row:
            val = row[col]
            if val is not None and str(val).strip() != "" and str(val).lower() != "nan":
                return str(val).strip()
    return None


def _trim(value, max_len):
    if value is None:
        return None
    text = str(value).strip()
    if not text:
        return None
    return text[:max_len]


def _iter_excel_chunks(file_path, engine, chunk_size):
    """
    Excel은 read_excel의 chunksize를 지원하지 않으므로,
    ExcelFile + skiprows/nrows 방식으로 청크를 순회합니다.
    """
    excel = pd.ExcelFile(file_path, engine=engine)
    sheet_name = excel.sheet_names[0]

    start_row = 0
    while True:
        if start_row == 0:
            chunk_df = excel.parse(sheet_name=sheet_name, nrows=chunk_size)
        else:
            # header(첫 줄) 제외 + 이전 행 스킵
            skip = range(1, start_row + 1)
            chunk_df = excel.parse(
                sheet_name=sheet_name,
                skiprows=skip,
                nrows=chunk_size,
                header=0
            )

        if chunk_df.empty:
            break

        yield chunk_df
        start_row += chunk_size
