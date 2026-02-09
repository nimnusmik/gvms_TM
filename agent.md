# GV TM - 프로젝트 안내서 (agent.md)

이 문서는 GV TM 모노레포의 구조, 핵심 도메인, 실제 코드 기준 동작 흐름, 실행 방법, 규칙을 **현재 코드 기준으로 상세히** 정리한 안내서입니다.

---

## 0) 프로젝트 개요
GV TM은 고객 리드를 수집/관리하고 1차 TM → 2차 영업으로 이어지는 영업 파이프라인을 운영하는 CRM/콜센터 성격의 시스템입니다.

- **백엔드**: Django + DRF + Celery
- **웹**: Vite + React (관리자/운영자용)
- **모바일**: React 기반 클라이언트
- **DB/캐시**: Postgres, Redis

핵심은 다음 3가지입니다.
1) **고객(Customer)** 은 기본 정보(이름/연락처/분야/지역 등)를 저장하는 원천 테이블
2) **영업 배정(SalesAssignment)** 이 실제 업무 단위(1차/2차 단계, 상태, 담당자 등)
3) **자동 배정**은 1차 단계 리드를 상담원에게 daily_cap 기준으로 분배

---

## 1) 저장 구조 요약 (모델 중심)

### 1.1 accounts 앱
- 커스텀 유저 모델: `accounts.Account`
- 이메일 로그인 기반, JWT(SimpleJWT) 사용

### 1.2 agents 앱
- 모델: `Agent`
  - `agent_id` (UUID PK)
  - `user` (Account 1:1)
  - `team` (SALES_TM, SALES_MAIN)
  - `role` (ADMIN, MANAGER, AGENT)
  - `status` (ONLINE, OFFLINE, BUSY, BREAK, RESIGNED)
  - `daily_cap`, `is_auto_assign`
  - `code` (사번 자동 생성)
- 상담원 생성/수정 시 자동배정 ON이면 즉시 배정 로직 실행
- 퇴사 처리 시 상담원 비활성화 + **배정된 리드 회수**

### 1.3 customers 앱
- 모델: `Customer`
  - `name`, `phone`, `age`, `gender`, `region`
  - `category_1`, `category_2`, `category_3`
  - `region_1`, `region_2`
  - `recycle_count`
  - **(레거시)** `status` 필드 존재 (실제 상태는 sales에서 관리)
- 엑셀 업로드 시 **Customer 생성 + SalesAssignment(1차/NEW) 생성**

### 1.4 sales 앱 (핵심 업무 엔티티)
- 모델: `SalesAssignment`
  - `customer` (Customer FK)
  - `agent` (담당 상담원)
  - `parent_assignment` (1차 ↔ 2차 연결)
  - `stage`: `1ST`(1차), `2ND`(2차)
  - `status`: NEW/ASSIGNED/TRYING/REJECT/ABSENCE/INVALID/SUCCESS
    - 2차 상태도 이 `status`를 사용 (BUY/REFUSAL/HOLD 포함)
  - `sentiment`, `item_interested`, `memo`
  - `assigned_at`, `updated_at`

- 모델: `CallLog`
  - 통화 시간, 결과, 녹음 파일 등

- 모델: `AssignmentLog`
  - 자동 배정 실행 로그

**중요:**
- 실제 업무 상태는 `SalesAssignment.status`로 관리
- 2차 배정은 **1차 SUCCESS 상태의 배정에 대해** `stage=2ND` 레코드를 생성해 연결

---

## 2) 자동 배정 (실제 코드 흐름)

### 2.1 배정 기준
- 대상: `SalesAssignment(stage=1ST, status=NEW, agent=None)`
- 상담원별 `daily_cap` 기준 부족분만큼 배정

### 2.2 호출 흐름
1) `/api/v1/sales/run-daily-assign/` 호출
2) Celery Task(`task_run_auto_assign`) 비동기 실행
3) 상담원별 `assign_leads_to_agent()` 실행
4) 결과 `AssignmentLog` 기록

### 2.3 주요 함수
- `customers/services.py`
  - `run_auto_assign_logic(agent)`
  - `run_auto_assign_batch_all(agents)`
- `sales/services.py`
  - `assign_leads_to_agent(agent, count)`

---

## 3) 엑셀 업로드 (실제 코드 흐름)

- 엔드포인트: `POST /api/v1/customers/upload_excel/`
- `CustomerUploadView` → 파일 저장 → Celery Task 호출
- Task: `customers/tasks.py::task_process_large_excel`
  - pandas로 청크 처리 (chunksize 미지원이면 전체 로드 fallback)
  - 컬럼 매핑 후 Customer 생성
  - 생성된 Customer에 대해 SalesAssignment(1차/NEW) 생성

컬럼 매핑 예시:
- name: 이름/회사명/상호명
- phone: 전화번호/휴대폰
- category_1~3: 분야1~3
- region_1~2: 지역1~2

---

## 4) 1차 → 2차 배정 흐름

### 4.1 기본 규칙
- 1차 `SUCCESS` 상태인 건만 2차 배정 가능
- 2차는 별도 `SalesAssignment(stage=2ND)` 레코드 생성
- 1차와 2차는 `parent_assignment`로 연결

### 4.2 수동 배정 API
- `POST /api/v1/sales/{id}/assign-secondary/`
  - 1차 SUCCESS인지 검사
  - 기존 2차 존재 여부 검사
  - 2차 레코드 생성

---

## 5) 주요 API 엔드포인트 (정리)

### Auth
- `/api/v1/auth/`

### Agents
- `/api/v1/agents/`
  - `GET /` 상담원 목록
  - `GET /candidates/`
  - `GET /me/`
  - `POST /{id}/resign/`
  - `GET /dashboard_stats/`
  - `GET /{id}/customers/` (해당 상담원 배정 목록)

### Customers
- `/api/v1/customers/`
  - `POST /upload_excel/`
  - `DELETE /reset-db/`

### Sales
- `/api/v1/sales/`
  - `GET /` (stage=1ST 기준 리드 목록)
  - `POST /bulk-assign/`
  - `POST /bulk-unassign/`
  - `POST /bulk-delete/` (선택 삭제 + 2차 연계 삭제)
  - `POST /run-daily-assign/`
  - `POST /{id}/assign-secondary/`

### Notices
- `/api/v1/notices/`

---

## 6) 프론트엔드(tm_web) 주요 화면 및 동작

### 6.1 상담원 관리
- 상담원 CRUD
- 팀/상태/배정량 수정
- 퇴사 처리
- 자동 배정 실행 버튼

### 6.2 리드 배정 관리(고객 관리 페이지)
- 1차 리드 리스트 조회 (`/sales/?stage=1ST`)
- 엑셀 업로드, 선택 배정/배정 취소
- **2차 배정 버튼**: SUCCESS 상태만 2차 배정 가능
- 2차 상태 변경 드롭다운 (BUY/REFUSAL/HOLD)
- 1차/2차 필터 제공

---

## 7) 디렉토리 구조 (핵심)
```
.
├─ backend/
│  ├─ apps/
│  │  ├─ accounts/
│  │  ├─ agents/
│  │  ├─ customers/
│  │  ├─ sales/
│  │  └─ notices/
│  ├─ config/
│  ├─ manage.py
│  └─ requirements.txt
├─ tm_web/
│  ├─ src/
│  │  ├─ features/
│  │  │  ├─ auth/
│  │  │  ├─ agents/
│  │  │  ├─ customers/
│  │  │  ├─ dashboard/
│  │  │  └─ notices/
│  │  ├─ routes/
│  │  └─ lib/
│  └─ package.json
├─ tm_mob/
│  └─ package.json
├─ docker-compose.yml
└─ .env
```

---

## 8) 실행 방법

### 8.1 Docker (권장)
```
docker compose up --build
```
- Django: http://localhost:8000
- Postgres: localhost:5432
- Redis: localhost:6379

### 8.2 웹 프론트엔드
```
cd tm_web
npm install
npm run dev
```

### 8.3 모바일/클라이언트
```
cd tm_mob
npm install
npm start
```

---

## 9) 환경 변수 (.env)
- `SECRET_KEY`
- `DEBUG`
- `ALLOWED_HOSTS`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_HOST`
- `POSTGRES_PORT`

---

## 10) 운영/개발 시 주의사항

- **실제 업무 상태는 `SalesAssignment.status` 기준**
- 2차는 무조건 `stage=2ND` 별도 레코드 생성
- 엑셀 업로드는 Customer + SalesAssignment(1차/NEW) 생성
- `customers.status`는 레거시 호환용 (실사용 X)
- 2차 상태 변경은 2차 레코드에 `PATCH /sales/{id}/`로 변경

---

## 11) 현재 구현된 추가 기능 요약
- 2차 배정 버튼 + 모달
- 2차 상태 변경 드롭다운
- 2차 상태/담당자 필터
- 선택 삭제 (1차 + 연결된 2차 삭제)
- 대용량 엑셀 처리 (chunksize 미지원 환경 fallback)

---

## 12) 다음 개선 후보
1) 2차 전용 리스트 페이지(stage=2ND 전용)
2) 2차 상태 변경 히스토리 로그
3) 권한별 접근 제한(ADMIN/MANAGER 전용 작업 분리)
4) 배정/콜로그 통계 대시보드 강화
