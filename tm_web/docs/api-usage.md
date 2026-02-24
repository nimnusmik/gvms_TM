# tm_web API Usage by Page

이 문서는 화면(페이지) 기준으로 어떤 API 엔드포인트를 사용하는지 요약합니다.
각 호출은 `@/lib/axios`를 통해 이루어집니다.

## /dashboard (DashboardOverviewPage)
- GET `/agents/dashboard_stats/`
  - Optional query params:
    - `table_days`: 최근 N일 기준으로 테이블 지표 집계
    - `start_date`, `end_date`: `YYYY-MM-DD` 범위 지정 (둘 다 있어야 적용)
  - 통계 카드, Top 3 성과자(table), 통화 추이(chart)
  - 파일: `tm_web/src/features/dashboard/hooks/useDashboardStats.ts`

## /dashboard/agents (AgentManagementPage)
- GET `/agents/`
  - 상담원 목록
  - 파일: `tm_web/src/features/agents/api/agentApi.ts`
- POST `/agents/`
  - 상담원 생성 (AgentCreateDialog)
  - 파일: `tm_web/src/features/agents/api/agentApi.ts`
- PATCH `/agents/{id}/`
  - 상담원 수정 (AgentEditDialog)
  - 파일: `tm_web/src/features/agents/api/agentApi.ts`
- POST `/agents/{id}/resign/`
  - 상담원 퇴사 처리
  - 파일: `tm_web/src/features/agents/api/agentApi.ts`
- DELETE `/agents/{id}/`
  - 상담원 삭제
  - 파일: `tm_web/src/features/agents/api/agentApi.ts`
- POST `/sales/run-daily-assign/`
  - 자동 배정 실행 (DashboardAutoAssignButton)
  - 파일: `tm_web/src/features/customers/api/customerApi.ts`

## /dashboard/customers (CustomerManagementPage)
- GET `/sales/?page=...&stage=1ST&...`
  - 고객/배정 목록 조회 (페이지네이션, 필터, 검색)
  - 파일: `tm_web/src/features/customers/api/customerApi.ts`
- PATCH `/sales/{id}/`
  - 담당자 배정/상태 업데이트
  - 파일: `tm_web/src/features/customers/api/customerApi.ts`
- POST `/sales/bulk-assign/`
  - 일괄 배정
  - 파일: `tm_web/src/features/customers/api/customerApi.ts`
- POST `/sales/bulk-unassign/`
  - 일괄 배정 취소
  - 파일: `tm_web/src/features/customers/api/customerApi.ts`
- POST `/sales/bulk-delete/`
  - 일괄 삭제
  - 파일: `tm_web/src/features/customers/api/customerApi.ts`
- POST `/sales/{id}/assign-secondary/`
  - 2차 배정
  - 파일: `tm_web/src/features/customers/api/customerApi.ts`
- PATCH `/sales/{id}/`
  - 2차 상태 업데이트
  - 파일: `tm_web/src/features/customers/api/customerApi.ts`
- POST `/customers/upload_excel/`
  - 엑셀 업로드
  - 파일: `tm_web/src/features/customers/api/customerApi.ts`
- DELETE `/customers/reset-db/`
  - DB 초기화
  - 파일: `tm_web/src/features/customers/api/customerApi.ts`
- GET `/agents/`
  - 담당자 목록 (필터용)
  - 파일: `tm_web/src/features/agents/api/agentApi.ts`
- GET `/agents/dashboard_stats/`
  - 상단 총 고객 수 (Dashboard 기준)
  - 파일: `tm_web/src/features/dashboard/api/dashboardApi.ts`

## /dashboard/notices (NoticePage)
- GET `/notices/`
  - 공지 목록
  - 파일: `tm_web/src/features/notices/api/noticeApi.ts`
- POST `/notices/`
  - 공지 생성
  - 파일: `tm_web/src/features/notices/api/noticeApi.ts`
- DELETE `/notices/{id}/`
  - 공지 삭제
  - 파일: `tm_web/src/features/notices/api/noticeApi.ts`

## /dashboard/performance (PerformancePage)
- GET `/agents/dashboard_stats/`
  - 성과 카드/테이블/차트 데이터
  - 파일: `tm_web/src/features/performance/pages/PerformancePage.tsx`
- GET `/agents/`
  - 상담원 목록 (카드 구성)
  - 파일: `tm_web/src/features/performance/pages/PerformancePage.tsx`

## /login (LoginPage)
- POST `/auth/login/`
  - 로그인
  - 파일: `tm_web/src/features/auth/api/authApi.ts`

## /signup (SignupPage)
- POST `/auth/signup/`
  - 회원가입
  - 파일: `tm_web/src/features/auth/api/authApi.ts`
