# 수정 / 최적화 노트 (체크리스트)

마지막 업데이트: 2026-02-23  
범위: 백엔드(Django), DB, 데이터 파이프라인

## 1. 지금 당장 해야 하는 것 (가장 효과 큼)

- [x] **대량 업로드 시 중복 배정 방지 완료**
  - 파일: `backend/apps/customers/tasks.py`
  - 내용: 활성 1차 배정(NEW/ASSIGNED/TRYING)이 있으면 신규 배정 생성하지 않음

- [x] **통화 로그 인덱스 추가 완료**
  - 파일: `backend/apps/calls/models.py`
  - 추가 인덱스:
    - `(assignment_id, call_start)`
    - `(agent_id, call_start)`
  - 다음 단계: 마이그레이션 생성/적용

## 2. 우선순위 높음 (성능 안정화)

- [x] **sales 인덱스 변경 마이그레이션 생성/적용**
  - 파일: `backend/apps/sales/models.py`
  - 실행: `python backend/manage.py makemigrations sales` 후 migrate
  - 참고: `storages` 패키지 누락 시 실패하므로 의존성 준비 후 실행

- [x] **통화 로그 인덱스 마이그레이션 생성/적용**
  - 파일: `backend/apps/calls/models.py`
  - 실행: `python backend/manage.py makemigrations calls` 후 migrate

- [ ] **쿼리 계획 확인 (`EXPLAIN ANALYZE`)**
  - 대상 쿼리:
    - 재활용 후보 쿼리
    - 일일 할당량 쿼리
    - 신규 리드 땡겨오기 쿼리

## 3. 필요 시 개선 (트래픽 늘면 진행)

- [ ] **고객 검색 인덱스 보강**
  - 파일: `backend/apps/customers/models.py`
  - 대상: `name`, `phone`, `region`, `region_1`, `region_2`, `category_1..3`

- [ ] **고객별 최신 배정 조회 최적화**
  - 파일: `backend/apps/sales/services.py`
  - 현재: `order_by('-assigned_at', '-id')` + `(customer, assigned_at)` 인덱스
  - 느리면 캐시 테이블/필드 고려

## 4. 운영 안정성 체크

- [ ] **KST 기준 일일 할당량 확인**
  - 파일: `backend/apps/sales/services.py`
  - 서버/DB 타임존 설정이 바뀌면 일일 집계가 어긋날 수 있음

- [ ] **`storages` 의존성 관리**
  - 파일: `backend/config/settings.py`
  - dev 환경에서 `django-storages` 설치 여부 문서화/가드 처리
