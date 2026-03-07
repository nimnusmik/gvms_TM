# TM 상담원 앱(tm_mob) 개발 문의 정리

## 배경
- 현재 `backend`와 `tm_web`로 관리자 페이지(배정, 운영, 성과, 공지 등)를 구현 완료함.
- 이제 `tm_mob`에서 상담원용 앱을 개발해 전화 업무와 기록을 연동하려고 함.

## 현재 구현된 관리자 웹 범위(요약)
- 라우트 기준: `/dashboard` 아래에 상담원 관리, 고객/배정 관리, 성과, 공지, 배정 이력, 정산, AI 서비스 페이지가 있음.
- 페이지별 API 정리는 `tm_web/docs/api-usage.md`에 문서화됨.

 1) 프로젝트 구조

  - backend/ Django + DRF + Celery, API base: http://localhost:8000/api/v1
  - tm_web/ Vite + React 관리자 웹
  - tm_mob/ React Native(Expo/CRA 혼합) 상담원 앱(로그인 화면만 있음)

  2) 관리자 웹(tm_web) 구현 현황

  - 라우트: tm_web/src/routes/router.tsx
  - 주요 페이지:
      - /dashboard 대시보드(통계/차트)
      - /dashboard/agents 상담원 CRUD
      - /dashboard/customers 1차 리드 관리(배정/상태/검색/일괄)
      - /dashboard/customers-success 성공 고객
      - /dashboard/customers-recycle 재활용 후보
      - /dashboard/notices 공지 관리
      - /dashboard/performance 성과 카드/표
      - /dashboard/assignment-history 배정 이력
      - /dashboard/settlement 정산 관리
      - /dashboard/ai-service AI 서비스
  - 페이지별 사용 API 요약: tm_web/docs/api-usage.md

  3) 백엔드 핵심 모델

  - SalesAssignment(영업 배정)
      - stage: 1ST(1차 TM), 2ND(2차)
      - status: NEW, ASSIGNED, TRYING, REJECT, INVALID, SUCCESS, BUY, HOLD
      - sentiment, memo, item_interested, parent_assignment
  - CallLog(통화 기록)
      - assignment, agent, call_start, call_duration, result_type
      - 녹취 메타: recording_file, recording_status, recording_mime, recording_size, recording_uploaded_at
  - Agent(상담원 프로필)
      - role: ADMIN, MANAGER, AGENT
      - status: OFFLINE, ONLINE, BREAK, BUSY, RESIGNED
      - assigned_phone, daily_cap, is_auto_assign

  4) 백엔드 주요 API

  - Auth
      - POST /api/v1/auth/login/ (JWT)
      - POST /api/v1/auth/signup/
  - Agents
      - GET/POST/PATCH/DELETE /api/v1/agents/
      - POST /api/v1/agents/{id}/resign/
      - GET /api/v1/agents/dashboard_stats/
  - Sales(배정)
      - GET /api/v1/sales/?stage=1ST... (리드/배정 조회)
      - PATCH /api/v1/sales/{id}/ (상태/담당자 변경)
      - POST /api/v1/sales/bulk-assign/, bulk-unassign/, bulk-delete/
      - POST /api/v1/sales/run-daily-assign/ (자동 배정)
      - POST /api/v1/sales/{id}/assign-secondary/ (2차 배정)
      - GET /api/v1/sales/assignment-history/summary|detail|export
  - Calls(통화 로그)
      - GET/POST /api/v1/calls/logs/
      - POST /api/v1/calls/logs/{id}/recording-upload
      - POST /api/v1/calls/logs/{id}/recording-complete
      - GET /api/v1/calls/logs/{id}/recording-url
      - 통화 로그 생성 시 배정 상태 자동 변경 로직 있음

  5) 모바일(tm_mob) 현재 상태

  - App.js에서 Login -> Home 단순 네비게이션
  - LoginScreen에서 /auth/login 호출 후 토큰 SecureStore 저장
  - tm_mob/src/api/client.js: baseURL은 http://10.0.2.2:8000/api/v1(Android) / http://localhost:8000/api/v1(iOS)

  6) 발견된 이슈/주의점

  - 로그인 필드 불일치:
      - 백엔드 Account.USERNAME_FIELD는 email
      - tm_mob은 login_id로 전송 중
  - CallLog Result enum과 perform_create 로직 간 불일치 가능
      - 모델: SUCCESS, REJECT, ABSENCE, INVALID
      - 뷰 로직엔 WRONG_NUMBER, BUSY, LATER 사용 흔적

## tm_mob (Android) 
핵심 기능(필수 5가지)
1. **전화 바로 걸기**
   - 배정 리스트에서 고객 전화번호를 바로 통화 앱으로 연결하는 버튼 필요.
2. **통화 종료 직후 기록 페이지 이동**
   - 통화가 끝나면 곧바로 기록 입력 화면으로 자동 전환되길 원함.
3. **기록 저장 → 관리자 웹 실시간 확인**
   - 상담원이 기록 저장하면 관리자 페이지에서 즉시 확인 가능해야 함.
4. **성공 건 녹음 업로드**
   - 통화 결과가 “성공”인 경우에만 녹취 파일을 업로드.
5. **내 작업현황 확인**
   - 오늘 콜 수, 성공/거절/부재 통계, 내 배정 리스트, 진행 상태 등을 확인할 수 있는 화면 필요.

## tm_mob 현재 상태(간단)
- 로그인 화면과 홈(플레이스홀더)만 존재.
- 로그인 시 토큰을 `SecureStore`에 저장.
- API baseURL:
  - Android 에뮬레이터: `http://10.0.2.2:8000/api/v1`
  - iOS 시뮬레이터: `http://localhost:8000/api/v1`

## 핵심 백엔드 모델(요약)
- `SalesAssignment` (영업 배정)
  - `stage`: `1ST`/`2ND`
  - `status`: `NEW`, `ASSIGNED`, `TRYING`, `REJECT`, `INVALID`, `SUCCESS`, `BUY`, `HOLD`
- `CallLog` (통화 기록)
  - `assignment`, `agent`, `call_start`, `call_duration`, `result_type`
  - 녹취 메타: `recording_file`, `recording_status`, `recording_mime`, `recording_size`, `recording_uploaded_at`

## 백엔드 연결 포인트(이미 존재)
- `POST /api/v1/calls/logs/` : 통화 기록 생성
- `POST /api/v1/calls/logs/{id}/recording-upload` : 녹취 presigned URL 발급
- `POST /api/v1/calls/logs/{id}/recording-complete` : 업로드 완료 처리
- `GET /api/v1/sales/?stage=1ST&agent=...` : 상담원 배정 리스트
- `GET /api/v1/agents/dashboard_stats/` : 성과 지표(관리자용)

## 묻고 싶은 핵심
- React Native에서 “통화 종료 감지 → 기록 화면 자동 전환”을 안정적으로 구현하는 방법
- 통화 기록 입력을 강제하고, 실패/오프라인 상황에서 복구하는 UX 패턴
- 관리자 웹 “실시간 반영”을 위해 필요한 기술(폴링 vs 실시간) 선택 기준
- 녹취 업로드 presigned URL 플로우 설계와 보안 주의점
- 모바일 작업현황 화면에 필요한 최소 지표 + API 설계 제안

## 추가로 고민 중인 이슈/정합성 체크
- 로그인 필드 불일치 가능성: 백엔드는 `email` 기반 로그인, tm_mob은 `login_id`로 전송 중.
- CallLog 결과 enum과 뷰 로직 간 불일치 가능성:
  - 모델: `SUCCESS`, `REJECT`, `ABSENCE`, `INVALID`
  - 뷰 로직에 `WRONG_NUMBER`, `BUSY`, `LATER` 사용 흔적 있음.
- 통화 종료 감지를 iOS/Android 모두 지원해야 하는지?
- 모바일 전용 통계 API를 새로 만들지, 기존 관리자 API를 재사용할지?
- 성공 기준을 `CallLog.Result.SUCCESS`로만 볼지, `SalesAssignment.Status.SUCCESS`도 같이 볼지?


# TM 상담원 앱(tm_mob) 개발 계획 (Android, Expo)

  ## 요약

  Android 전용 Expo 앱으로 배정 리스트 → 전화 걸기 → 앱 복귀 시 기록 화면 → 기록 저장 → 성공 시 녹취 업로드 → 내 작업현황 플로우를 완성한다.
  실시간 반영은 관리자 웹에서 5~30초 폴링 기준으로 충분하며, 통화 종료 감지는 앱 복귀 시 기록 화면 자동 전환 방식으로 구현한다.

  ———

  ## 범위와 목표

  - 필수 기능 5가지 모두 구현
  - “통화 종료 감지”는 OS 레벨 감지가 아닌 앱 복귀 트리거
  - 녹취 파일은 사용자가 로컬 파일 선택 후 업로드 (S3 presigned URL)
  - 통계는 내 작업현황 전용 API를 추가하거나 기존 API의 최소 안전 활용

  ———

  ## 아키텍처 및 구현 방향

  ### 1) 런타임/스택 정리 (Expo Managed Workflow)

  - 현재 react-scripts 기반 구성은 Expo 네이티브 목표와 충돌
  - tm_mob를 Expo 중심으로 전환
      - 스크립트: expo start, expo android, expo ios
      - 불필요한 CRA 의존성 정리 (react-scripts 계열 제거)
  - 네비게이션: @react-navigation/native, native-stack 유지

  ### 2) 화면 구조 (Navigation)

  - Auth Stack
      - LoginScreen
  - Main Tabs (권장)
      - AssignmentsScreen (배정 리스트)
      - MyStatsScreen (내 작업현황)
      - HistoryScreen (내 통화 기록)
      - SettingsScreen (로그아웃, 프로필)
  - Modal/Stack
      - CallRecordScreen (통화 기록 입력)
      - RecordingUploadScreen (성공 건 녹취 업로드)

  ### 3) 상태/데이터 레이어

  - Auth
      - SecureStore에 accessToken, refreshToken, userInfo
      - Axios 인터셉터로 토큰 부착
  - AppState 기반 콜 세션 관리
      - “전화 버튼 누름” 시 pendingCall 저장
      - AppState가 active로 돌아오면 CallRecordScreen 자동 이동
  - 오프라인 대비
      - 기록 생성 실패 시 로컬 큐(AsyncStorage) 저장 → 재시도

  ———

  ## 사용자 플로우 상세

  ### A. 배정 리스트 → 전화 걸기

  1. /api/v1/sales/?stage=1ST 호출
      - 서버에서 로그인 사용자 기준 필터링됨 (관리자 아닌 경우 본인 배정만)
  2. 리스트에서 전화 버튼 클릭 → Linking.openURL("tel:...")
  3. 전화 시작 시각 call_start 로컬 기록

  ### B. 통화 종료 → 기록 페이지 자동 전환

  - AppState 복귀 시 pendingCall 확인
  - CallRecordScreen 자동 이동
  - 통화 시간은 Date.now() - call_start로 추정, 사용자 수정 가능

  ### C. 기록 저장 → 관리자 웹 반영

  1. POST /api/v1/calls/logs/
      - 요청 필드: assignment, call_start, duration, result
  2. 선택적으로 PATCH /api/v1/sales/{id}/
      - memo, sentiment, item_interested 저장
  3. 관리자는 5~30초 폴링 기준으로 반영 확인

  ### D. 성공건 녹취 업로드

  1. 기록 결과가 SUCCESS일 때만 업로드 버튼 노출
  2. 로컬 파일 선택 (DocumentPicker or MediaLibrary)
  3. POST /api/v1/calls/logs/{id}/recording-upload → presigned URL 수신
  4. PUT 업로드 → recording-complete 호출
  5. 업로드 상태 표시 (PENDING/UPLOADED/FAILED)

  ### E. 내 작업현황

  - 목표 지표: 오늘 콜수, 성공/거절/부재/무효, 평균 통화시간, 진행 중 배정 건수
  - 권장 API 신규 추가
      - GET /api/v1/agents/me/stats?start_date&end_date
      - 서버가 CallLog를 기준으로 집계
  - 대안(추가 API 없이):
      - /api/v1/calls/logs/?agent=... 호출 후 앱에서 집계

  ———

  ## 백엔드 변경 제안 (필요 시)

  1. 로그인 필드 정합성
      - tm_mob 요청 필드를 email로 통일
  2. CallLog 결과 enum 정합성
      - views.py에 존재하는 WRONG_NUMBER, BUSY, LATER 제거 혹은 모델에 추가
  3. 내 작업현황 전용 API 추가
      - /api/v1/agents/me/stats
  4. 토큰 갱신 엔드포인트 검토
      - SimpleJWT TokenRefreshView 추가 여부 결정

  ———

  ## 주요 변경/추가 인터페이스

  - 신규(권장): GET /api/v1/agents/me/stats
  - 변경 필요: tm_mob 로그인 요청 필드 → email
  - 정합성 수정: CallLog result enum vs view 로직

  ———

  ## 테스트/검증 시나리오
  2. 배정 리스트 조회 (본인 배정만 반환되는지)
  4. 기록 저장 성공 → 관리자 웹 30초 내 반영 확인
  5. 성공건에서 녹취 파일 선택 → presigned 업로드 → 완료 처리
  6. 오프라인 상태 기록 저장 → 큐 저장 → 재접속 시 재시도
  7. 내 작업현황 통계가 실제 기록과 일치하는지

  ———

  ## 명시적 가정/기본값

  - 플랫폼은 Android only
  - 통화 종료 감지는 앱 복귀 트리거 방식
  - “실시간”은 5~30초 폴링으로 충분
  - 녹취 파일은 사용자 파일 선택 후 업로드
  - tm_mob는 Expo 네이티브 앱으로 정리
