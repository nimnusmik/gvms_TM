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
- 퇴사 처리: 상담원 비활성화 + 배정 고객 회수

### 고객(customers)
- 상태: NEW, ASSIGNED, TRYING, REJECT, SUCCESS, LATER, INVALID
- 팀 기반 배정 (상담원 팀과 고객 팀 매칭)
- 엑셀 업로드로 대량 등록 가능

### 자동 배정 (핵심 흐름)
1. `/api/v1/customers/run-daily-assign/` 호출
2. Celery Task(`task_run_auto_assign`) 비동기 실행
3. 상담원별 `run_auto_assign_logic()` 수행
   - 상담원 현재 보유량 계산
   - daily_cap 만큼 부족분만큼 배정
   - `NEW` + `assigned_agent is null` + 동일 팀 고객을 오래된 순으로 가져와 배정
4. 결과는 `AssignmentLog`에 기록

## 3) 주요 API 엔드포인트 (요약)
- Auth: `/api/v1/auth/`
- Agents: `/api/v1/agents/`
  - `GET /candidates/`, `GET /me/`, `POST /{id}/resign/`
  - `GET /dashboard_stats/`
- Customers: `/api/v1/customers/`
  - `POST /upload_excel/`
  - `POST /bulk-assign/`, `POST /bulk-unassign/`
  - `POST /run-daily-assign/`
- Notices: `/api/v1/notices/`

## 4) 프론트엔드 구조 (tm_web)
- Router: `/dashboard` 하위에 `agents`, `customers`, `notices`
- `axios` baseURL은 접속 host에 맞춰 자동 결정
- 주요 기능
  - 상담원 관리 (CRUD, 퇴사처리)
  - 고객 관리 (엑셀 업로드, 배정/해제, 상태 관리)
  - 자동 배정 실행

## 5) 파일 트리 (핵심만)
```
.
├─ backend/
│  ├─ apps/
│  │  ├─ accounts/
│  │  ├─ agents/
│  │  ├─ customers/
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
- 고객 배정 로직은 팀/상태/캡 기준으로 동작 (서비스 로직은 `customers/services.py`)
- 자동 배정은 Celery 비동기로 수행되고 로그를 남김
- 상담원 삭제는 안전장치가 있고, 기본은 퇴사 처리
- 프론트엔드 API 호출은 `/api/v1` 기준

## 9) 현재 확인된 개선 포인트
- 프론트에서 호출하는 `DELETE /customers/reset-db/`가 백엔드에 아직 구현되어 있지 않음
- Celery Beat 스케줄은 구성되어 있으나 실제 스케줄 등록은 미구현

## 10) 다음 스텝 제안
1. `customers/reset-db/` API 구현 여부 결정 및 정리
2. 자동 배정 로그/이력 페이지 UI와 백엔드 조회 API 강화
3. 고객 상태 변경 워크플로우 정의(TRYING/REJECT/SUCCESS 등)
4. 테스트/권한(역할별 접근 제어) 강화
