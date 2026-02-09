# GV TM - 프로젝트 안내서 (agent.md)

이 문서는 GV TM 모노레포의 구조, 핵심 로직, 실행 방법, 규칙, 향후 스텝을 한눈에 파악하기 위한 요약입니다.

## 1) 프로젝트 개요
- 고객 DB를 수집/관리하고 상담원에게 배정(자동/수동)하는 CRM 성격의 시스템입니다.
- 웹/모바일/백엔드가 하나의 모노레포에 공존합니다.

구성 요소
- `backend/`: Django + DRF + Celery (Postgres/Redis 연동)
- `tm_web/`: Vite + React (관리자/운영자용 웹)
- `tm_mob/`: React 기반 클라이언트 (CRA 기반, 모바일/웹 혼용)
- `docker-compose.yml`: Postgres, Redis, Django, Celery Worker/Beat

## 2) 핵심 도메인/로직 요약

### 계정/인증
- 커스텀 유저 모델: `accounts.Account` (이메일 로그인)
- JWT 기반 인증 (DRF SimpleJWT)

### 상담원(agents)
- 모델: `Agent` (팀, 역할, 상태, 일일할당량, 자동배정 여부)
- 생성/수정 시 자동배정 ON이면 즉시 배정 로직 수행
- 퇴사 처리: 상담원 비활성화 + 배정 리드 회수

### 고객(customers)
- 고객 기본 정보 저장용(이름/전화/분야/지역 등)
- 엑셀 업로드로 대량 등록 가능
- (레거시) `customers.status`는 존재하나, 실제 영업 상태는 `sales`에서 관리

### 영업/배정(sales)
- 모델: `SalesAssignment` (고객-상담원 배정 단위)
- 상태: NEW, ASSIGNED, TRYING, REJECT, ABSENCE, INVALID, SUCCESS
- 1차/2차 단계(stage) 구분
- 엑셀 업로드 시 고객 생성 + 1차/NEW 배정 레코드 자동 생성

### 자동 배정 (핵심 흐름)
1. `/api/v1/sales/run-daily-assign/` 호출
2. Celery Task(`task_run_auto_assign`) 비동기 실행
3. 상담원별 `run_auto_assign_logic()` 수행
   - 상담원 현재 보유량 계산
   - daily_cap 만큼 부족분만큼 배정
   - `NEW` + `agent is null` + 1차 리드를 오래된 순으로 가져와 배정
4. 결과는 `AssignmentLog`에 기록

## 3) 주요 API 엔드포인트 (요약)
- Auth: `/api/v1/auth/`
- Agents: `/api/v1/agents/`
  - `GET /candidates/`, `GET /me/`, `POST /{id}/resign/`
  - `GET /dashboard_stats/`
- Customers: `/api/v1/customers/`
  - `POST /upload_excel/`
  - `DELETE /reset-db/`
- Sales: `/api/v1/sales/`
  - `GET /` (리드/배정 목록)
  - `POST /bulk-assign/`, `POST /bulk-unassign/`
  - `POST /run-daily-assign/`
- Notices: `/api/v1/notices/`

## 4) 프론트엔드 구조 (tm_web)
- Router: `/dashboard` 하위에 `agents`, `customers`, `notices`
- `axios` baseURL은 접속 host에 맞춰 자동 결정
- 주요 기능
  - 상담원 관리 (CRUD, 퇴사처리)
  - 리드/배정 관리 (엑셀 업로드, 배정/해제, 상태 관리)
  - 자동 배정 실행 (sales 기준)

## 5) 파일 트리 (핵심만)
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

## 6) 실행 방법

### 백엔드 + DB + Redis (Docker)
```
docker compose up --build
```
- Django: http://localhost:8000
- Postgres: localhost:5432
- Redis: localhost:6379

### 웹 프론트엔드
```
cd tm_web
npm install
npm run dev
```

### 모바일/클라이언트
```
cd tm_mob
npm install
npm start
```

## 7) 환경 변수 (.env)
- `SECRET_KEY`
- `DEBUG`
- `ALLOWED_HOSTS`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_HOST`
- `POSTGRES_PORT`

## 8) 규칙/운영 원칙
- 자동 배정 로직은 `customers/services.py`에서 `SalesAssignment` 기준으로 동작
- 자동 배정은 Celery 비동기로 수행되고 로그를 남김
- 상담원 삭제는 안전장치가 있고, 기본은 퇴사 처리
- 프론트엔드 API 호출은 `/api/v1` 기준

## 9) 현재 확인된 개선 포인트
- 엑셀 대용량 처리 시 pandas 버전에 따라 chunksize 미지원 가능 (fallback 처리 있음)
- Celery Beat 스케줄은 구성되어 있으나 실제 스케줄 등록은 미구현

## 10) 다음 스텝 제안
1. 자동 배정 로그/이력 페이지 UI와 백엔드 조회 API 강화
2. 2차(stage=2ND) 워크플로우 및 전환 규칙 정의
3. 테스트/권한(역할별 접근 제어) 강화
