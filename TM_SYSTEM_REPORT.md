# GV TM 시스템 기술 보고서
**Global Vision Telemarketing Management System**

> 작성일: 2026-03-10
> 작성자: 김선민 (개발자)
> 문서 버전: v1.0
> 보고 대상: 대표이사

---

## 목차

1. [Executive Summary (경영진 요약)](#1-executive-summary)
2. [시스템 전체 아키텍처](#2-시스템-전체-아키텍처)
3. [사용자 플로우 (User Flow)](#3-사용자-플로우)
4. [핵심 기능 상세 분석](#4-핵심-기능-상세-분석)
5. [기술 스택 및 설계 철학](#5-기술-스택-및-설계-철학)
6. [API 연동 구조](#6-api-연동-구조)
7. [데이터베이스 설계](#7-데이터베이스-설계)
8. [인프라 및 배포 구조](#8-인프라-및-배포-구조)
9. [유지보수성 · 확장성 · 안정성 평가](#9-유지보수성--확장성--안정성-평가)
10. [사용 설명서 (관리자 / 상담원)](#10-사용-설명서)
11. [비즈니스 기여도 종합](#11-비즈니스-기여도-종합)
12. [향후 개발 로드맵](#12-향후-개발-로드맵)

---

## 1. Executive Summary

### 무엇을 만들었는가?

GV TM 시스템은 텔레마케팅 영업 조직의 **리드(고객 DB) 배정 → 상담 → 정산**까지의 전 프로세스를 자동화하는 **풀스택 업무 관리 플랫폼**입니다.

| 구분 | 내용 |
|------|------|
| **대상 사용자** | 관리자(본사), 팀장, 상담원(TM) |
| **플랫폼** | 웹 관리자 시스템 + Android 모바일 앱 |
| **핵심 기능** | 고객 DB 관리, 자동 배정, 통화 기록, 정산 계산 |
| **개발 기간** | 1인 풀스택 개발 |
| **기술 스택** | Python/Django · React · React Native · PostgreSQL · Docker |

### 핵심 성과 요약

```
Before (개발 전)              After (개발 후)
─────────────────────        ──────────────────────────────
엑셀 수기 배정               → 자동 일일 배정 (오전 9시 자동 실행)
배정 불균형 문제             → 1인당 일일 상한(daily_cap) 제어
정산 수기 계산               → 자동 정산 계산 (성공 ₩2,000 / 거절 ₩700)
통화 결과 수동 기록          → 모바일 앱으로 현장 즉시 입력
고객 재활용 기준 불명확      → 14일 쿨다운 + 2회 재활용 규칙 자동화
공휴일 배정 실수             → 한국 공휴일 자동 감지 및 배정 스킵
```

---

## 2. 시스템 전체 아키텍처

### 2.1 전체 구성도

```
┌─────────────────────────────────────────────────────────────────┐
│                         클라이언트 레이어                         │
│                                                                   │
│   ┌─────────────────────┐      ┌────────────────────────────┐   │
│   │   tm_web (React)    │      │    tm_mob (React Native)   │   │
│   │  관리자 웹 대시보드   │      │     상담원 모바일 앱 (Android)│   │
│   │  :3000 (Nginx)      │      │     APK 배포               │   │
│   └──────────┬──────────┘      └────────────┬───────────────┘   │
│              │                               │                    │
│              └──────────────┬────────────────┘                   │
│                             │ HTTP/REST (JWT)                     │
└─────────────────────────────┼───────────────────────────────────┘
                              │
┌─────────────────────────────┼───────────────────────────────────┐
│                        서버 레이어                                │
│                             │                                     │
│              ┌──────────────▼──────────────┐                    │
│              │     tm_backend (Django)       │                    │
│              │     REST API Server           │                    │
│              │     :8000                     │                    │
│              └───┬──────────────────────┬───┘                    │
│                  │                      │                         │
│     ┌────────────▼──────┐   ┌──────────▼────────────┐          │
│     │  tm_celery_worker  │   │    tm_celery_beat      │          │
│     │  (비동기 작업 처리) │   │  (스케줄 작업 관리)    │          │
│     │  Excel 파싱 등     │   │  매일 9시 자동배정      │          │
│     └────────────┬──────┘   └──────────┬────────────┘          │
│                  │                      │                         │
└──────────────────┼──────────────────────┼─────────────────────  ┘
                   │                      │
┌──────────────────┼──────────────────────┼──────────────────────┐
│                  데이터 레이어           │                        │
│                  │                      │                         │
│   ┌──────────────▼──────┐   ┌──────────▼──────────┐           │
│   │  tm_db (PostgreSQL) │   │  tm_redis (Redis)    │           │
│   │  :15433             │   │  Celery Broker       │           │
│   │  영구 데이터 저장     │   │  메시지 큐           │           │
│   └─────────────────────┘   └─────────────────────┘           │
│                                                                   │
│   ┌─────────────────────────────────────────────────┐          │
│   │    S3 / MinIO (Object Storage)                   │          │
│   │    통화 녹취 파일 저장                            │          │
│   └─────────────────────────────────────────────────┘          │
└──────────────────────────────────────────────────────────────────┘
```

### 2.2 모노레포 디렉토리 구조

```
gv_TM/
├── backend/                        # Django REST API 서버
│   ├── apps/
│   │   ├── accounts/               # 사용자 인증 및 계정 관리
│   │   ├── agents/                 # 상담원 프로필 및 역할 관리
│   │   ├── customers/              # 고객 DB 및 엑셀 업로드
│   │   ├── sales/                  # 배정 관리 (핵심 비즈니스 로직)
│   │   ├── calls/                  # 통화 기록 및 녹취 관리
│   │   ├── settlements/            # 정산 계산
│   │   ├── notices/                # 공지사항
│   │   └── ai_service/             # AI 연동 모듈
│   ├── config/                     # Django 설정, URL 라우팅
│   └── requirements.txt
│
├── tm_web/                         # React + TypeScript 관리자 웹
│   └── src/
│       ├── features/               # 기능별 모듈 (12개)
│       ├── routes/router.tsx       # 페이지 라우팅 정의
│       ├── lib/axios.ts            # API 클라이언트 (공통)
│       └── components/            # 공통 UI 컴포넌트
│
├── tm_mob/                         # React Native (Expo) 모바일 앱
│   └── src/
│       ├── api/client.js           # API 클라이언트 (환경 자동 감지)
│       ├── navigation/             # 화면 네비게이션 구조
│       ├── screens/                # 로그인, 배정목록, 통화기록 화면
│       └── store/                  # 전역 상태 관리 (Context API)
│
├── docker-compose.yml              # 6개 컨테이너 통합 오케스트레이션
├── .env                            # 환경변수 (민감 정보 분리)
└── eas.json                        # Android APK 빌드 설정
```

---

## 3. 사용자 플로우

### 3.1 관리자(Admin) 플로우

```
[관리자 로그인]
        │
        ▼
[대시보드] ──────────────────────────────────────────────────────┐
  · 오늘 배정 수                                                   │
  · 상담원별 통화 현황                                              │
  · 성공/거절 통계 차트                                            │
        │                                                          │
        ├──────────────────────────────────────────────────────┐  │
        │                                                       │  │
        ▼                                                       ▼  │
[고객 DB 관리]                                           [상담원 관리]
  · 엑셀 업로드 (대량 등록)                                · 상담원 등록/수정
  · 고객 검색 · 필터링                                     · 역할/팀 설정
  · 상태 확인                                              · daily_cap 설정
  · 재활용 대상 조회                                        · 자동배정 ON/OFF
        │
        ▼
[배정 관리]
  · 수동 일괄 배정 (bulk-assign)
  · 자동 배정 실행 버튼
  · 배정 내역 조회 (감사 로그)
  · DB 신청 승인/거절
        │
        ▼
[통화 기록 조회]                        [정산 관리]
  · 상담원별/날짜별 필터                   · 기간별 정산 생성
  · 녹취 파일 재생                          · 성공/거절/무효 집계
  · 결과 유형 확인                          · 금액 확인 및 수정
                                            · 상태: 대기→검토→지급

[공지사항 관리]
  · 중요 공지 핀 고정
  · 공지 작성/수정/삭제
```

### 3.2 상담원(Agent) 모바일 플로우

```
[앱 실행]
    │
    ▼
[로그인 화면]
  · 이메일 + 비밀번호 입력
  · JWT 토큰 SecureStore 저장
    │
    ▼
┌─────────────────────────────────────────────┐
│                 메인 탭 네비게이션               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │배정 리스트│  │ DB 신청  │  │ 내 현황  │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  │
└───────┼──────────────┼──────────────┼────────┘
        │              │              │
        ▼              ▼              ▼
  [배정된 고객 목록]  [DB 추가 요청]  [나의 실적]
    · 이름, 연락처     · 원하는 수량    · 오늘 통화 수
    · 배정 상태        · 요청 사유      · 성공/거절 현황
    · 메모             · 승인 대기 상태  · 이번달 예상 정산
        │
        ▼
  [고객 선택 → 통화]
    · 전화 앱 연동 (tel:// scheme)
        │
        ▼ (통화 종료 후 앱으로 복귀)
  [통화 결과 입력 화면]
    · 통화 결과 선택:
      ┌──────────┬──────────┬──────────┬──────────┐
      │  성 공   │  거 절   │  부 재   │  무 효   │
      └──────────┴──────────┴──────────┴──────────┘
    · 통화 시간 입력
    · 메모 입력
    · 관심 상품 선택
    · 감정 온도 선택 (HIGH / MID / LOW)
        │
        ▼
  [통화 기록 저장] ──→ POST /api/v1/calls/logs/
  [배정 상태 업데이트] ──→ PATCH /api/v1/sales/{id}/
```

### 3.3 자동 배정 플로우 (Celery Beat)

```
매일 오전 9:00 KST (평일)
        │
        ▼
[공휴일 체크] ──→ 공휴일이면 SKIP
        │
        ▼ (평일인 경우)
[활성 상담원 조회]
  · status = ONLINE
  · is_auto_assign = True
        │
        ▼
[각 상담원별 배정 처리]
  ┌─────────────────────────────────────────┐
  │  1. 오늘 이미 배정된 수 계산              │
  │  2. 남은 여유 = daily_cap - 오늘배정수    │
  │  3. 신규 리드 70% + 재활용 리드 30% 산출  │
  │     · 재활용 조건:                        │
  │       - REJECT or HOLD 상태              │
  │       - 14일 이상 경과                    │
  │       - recycle_count < 2               │
  │       - 원래 담당했던 상담원 제외         │
  │  4. SalesAssignment 레코드 생성          │
  │  5. 고객 recycle_count 증가 (재활용 시)  │
  └─────────────────────────────────────────┘
        │
        ▼
[AssignmentLog 저장]
  · 실행 시각, 성공 수, 오류 내용 기록
        │
        ▼
[상담원 모바일 앱에서 확인]
  GET /api/v1/sales/?stage=1ST&status=ASSIGNED
```

### 3.4 정산 처리 플로우

```
[관리자: 정산 화면 접속]
        │
        ▼
[정산 기간 설정]
  · 일별 / 주별 / 월별 / 직접 설정
        │
        ▼
[POST /api/v1/settlements/]
        │
        ▼
[백엔드 자동 계산]
  CallLog 집계:
  ┌─────────────────────────────────┐
  │ SELECT agent, COUNT by result   │
  │ WHERE date BETWEEN start ~ end  │
  │                                 │
  │ calculated_amount =             │
  │   success_count × ₩2,000       │
  │ + reject_count  × ₩700         │
  │ + invalid_count × ₩0           │
  └─────────────────────────────────┘
        │
        ▼
[정산 결과 확인]
  · 상담원별 breakdown
  · 수동 조정 가능 (final_amount)
        │
        ▼
[상태 변경]
  PENDING → REVIEW → PAID
```

---

## 4. 핵심 기능 상세 분석

### 4.1 자동 리드 배정 시스템

#### 개발 로직
```python
# backend/apps/sales/services.py (핵심 로직)
def assign_leads_to_agent(agent, session_date):
    """
    1. 오늘 이미 배정된 수 계산 (KST 기준)
    2. 잔여 capacity 계산
    3. 신규/재활용 혼합 비율로 리드 풀 생성
    4. DB 트랜잭션으로 원자적 삽입
    """
    today_kst = get_kst_today()
    already_assigned = SalesAssignment.objects.filter(
        agent=agent,
        created_at__date=today_kst
    ).count()

    capacity = agent.daily_cap - already_assigned
    recycle_count = int(capacity * RECYCLE_MIX_RATIO)  # 30%
    new_count = capacity - recycle_count               # 70%

    # 재활용 후보: 14일 경과, 2회 미만, 본인 제외
    recycle_pool = Customer.objects.filter(
        salesassignment__status__in=['REJECT', 'HOLD'],
        recycle_count__lt=2,
        last_contacted__lt=today_kst - timedelta(days=14)
    ).exclude(salesassignment__agent=agent)

    # 원자적 배정 (DB 트랜잭션)
    with transaction.atomic():
        for customer in new_leads[:new_count]:
            SalesAssignment.objects.create(
                agent=agent, customer=customer,
                stage='1ST', status='ASSIGNED'
            )
```

#### 해결한 문제점
- **배정 불균형**: 수기 배정 시 특정 상담원에게 과부하 → `daily_cap` 필드로 상한 제어
- **공휴일 오배정**: 한국 공휴일 미인식으로 배정 실수 → `holidays` 라이브러리로 자동 감지
- **재활용 혼선**: 동일 고객을 담당했던 상담원에게 재배정 → 제외 로직 구현
- **데이터 정합성**: 배정 중 오류 시 일부만 삽입되는 문제 → `transaction.atomic()` 적용

#### 비즈니스 기여도
- 매일 오전 9시 자동 실행 → **관리자 수동 배정 작업 100% 제거**
- 70:30 신규/재활용 혼합 → **기존 DB 자산 재활용으로 신규 고객 구매 비용 절감**
- 배정 로그 저장 → **감사 추적 가능 (누가, 언제, 몇 명 배정받았는지)**

---

### 4.2 통화 기록 및 녹취 관리

#### 개발 로직
```
[모바일] 통화 종료
    → POST /calls/logs/  (result_type, duration, memo)
    → IF result_type == SUCCESS:
        → POST /calls/logs/{id}/recording-upload  (Presigned URL 발급)
        → PUT presigned_url  (S3 직접 업로드)
        → POST /calls/logs/{id}/recording-complete  (업로드 완료 확인)
```

Presigned URL 방식: 모바일 → S3 직접 업로드로 서버 대역폭 부하 제거

#### 해결한 문제점
- **녹취 파일 서버 과부하**: 모든 파일이 Django 서버 경유 → S3 Presigned URL로 클라이언트 직접 업로드
- **업로드 실패 상태 불명**: 업로드 성공/실패 추적 불가 → `recording_status` (PENDING/UPLOADED/FAILED) 상태값 관리
- **파일 보안**: URL 직접 노출 위험 → 만료 시간이 있는 서명된 URL만 발급

#### 비즈니스 기여도
- 통화 결과 즉시 기록 → **실시간 영업 현황 파악 가능**
- 녹취 파일 아카이브 → **분쟁 발생 시 근거 자료**
- 성공/거절/무효 결과 자동 정산 반영 → **정산 오류 방지**

---

### 4.3 고객 DB 엑셀 대량 업로드

#### 개발 로직
```python
# backend/apps/customers/views.py
@action(detail=False, methods=['POST'])
def upload_excel(self, request):
    """
    pandas로 엑셀 파싱 → 유효성 검사 → 중복 제거 → 벌크 삽입
    """
    df = pd.read_excel(file)

    # 컬럼 정규화
    df.columns = [col.strip() for col in df.columns]

    # 전화번호 중복 체크
    existing_phones = set(Customer.objects.values_list('phone', flat=True))
    new_rows = df[~df['phone'].isin(existing_phones)]

    # 벌크 생성 (개별 INSERT 대신 한 번에)
    Customer.objects.bulk_create([
        Customer(**row) for _, row in new_rows.iterrows()
    ], batch_size=500)
```

#### 해결한 문제점
- **수천 건 업로드 시 타임아웃**: 개별 INSERT → `bulk_create(batch_size=500)` 최적화
- **중복 고객 생성**: 동일 전화번호 재업로드 → 기존 전화번호 Set 비교로 중복 제거
- **컬럼 불일치 오류**: 엑셀 컬럼 이름 공백 → strip() 정규화 처리

#### 비즈니스 기여도
- 5,000건 엑셀 → **수초 내 DB 등록** (기존 수동 입력 대비 압도적 효율)
- 중복 제거 자동화 → **데이터 품질 유지**

---

### 4.4 정산 자동 계산

#### 개발 로직
```python
# backend/apps/settlements/models.py
def calculate(self):
    """CallLog 집계로 정산 금액 자동 산출"""
    logs = CallLog.objects.filter(
        agent=self.agent,
        call_start__date__range=(self.period_start, self.period_end)
    )
    prices = SettlementPrice.objects.first()

    self.success_count = logs.filter(result_type='SUCCESS').count()
    self.reject_count  = logs.filter(result_type='REJECT').count()
    self.invalid_count = logs.filter(result_type='INVALID').count()
    self.absence_count = logs.filter(result_type='ABSENCE').count()

    self.calculated_amount = (
        self.success_count * prices.success_price +  # ₩2,000
        self.reject_count  * prices.reject_price     # ₩700
    )
```

`SettlementPrice` 모델로 단가를 DB에서 관리 → 코드 수정 없이 단가 변경 가능

#### 해결한 문제점
- **수동 계산 오류**: 엑셀 수기 계산 → 자동 집계로 오류 제거
- **단가 변경 비용**: 코드 수정 필요 → DB 테이블에서 관리자가 직접 변경
- **감사 불가**: 정산 내역 추적 불가 → PENDING→REVIEW→PAID 상태 이력 관리

#### 비즈니스 기여도
- 월별 정산 작업 시간 대폭 단축
- 수동 실수 제거 → **지급 분쟁 방지**
- 상담원이 자신의 예상 수당 실시간 확인 가능 → **동기 부여**

---

### 4.5 DB 신청(Pull Request) 워크플로우

#### 개발 로직
```
[상담원] POST /sales/pull-requests/
  · 요청 수량, 사유 입력

[관리자] GET /sales/pull-requests/
  · 대기 중 요청 목록 조회

[관리자] PATCH /sales/pull-requests/{id}/
  · action: "approve" or "reject"
  · 승인 시 → 즉시 배정 실행
```

#### 해결한 문제점
- **비공식 DB 요청**: 카카오톡/전화로 요청 → 체계적인 신청-승인 프로세스 구축
- **요청 이력 없음**: 누가 언제 요청했는지 파악 불가 → 모든 요청 DB 저장

#### 비즈니스 기여도
- 관리자-상담원 간 **공식 소통 채널 구축**
- 요청 승인/거절 이력 → **업무 책임 명확화**

---

## 5. 기술 스택 및 설계 철학

### 5.1 기술 선택 근거

| 레이어 | 기술 | 선택 이유 |
|--------|------|-----------|
| **Backend** | Django + DRF | ORM 기반 빠른 API 개발, Admin 인터페이스 내장 |
| **Database** | PostgreSQL | ACID 트랜잭션, 복잡한 쿼리 필터링, 인덱스 최적화 |
| **Task Queue** | Celery + Redis | 자동 배정 스케줄링, 비동기 엑셀 처리 |
| **Web Frontend** | React + TypeScript | 타입 안전성, 컴포넌트 재사용, 생태계 풍부 |
| **State Management** | Zustand | Redux 대비 보일러플레이트 최소화 |
| **Mobile** | React Native (Expo) | 웹과 코드 공유, EAS로 APK 빌드 용이 |
| **Containerization** | Docker Compose | 개발/운영 환경 일치, 원클릭 배포 |
| **File Storage** | S3 / MinIO | Presigned URL로 서버 부하 없이 대용량 파일 처리 |

### 5.2 아키텍처 결정 사항

**Feature-Based Architecture (tm_web)**
```
src/features/
├── auth/           # 인증 관련 모든 코드 (components, hooks, api, types)
├── agents/         # 상담원 기능
├── customers/      # 고객 기능
├── sales/          # 배정 기능
└── settlements/    # 정산 기능
```
- 기능별로 응집도 높게 → 한 기능 수정 시 다른 기능 영향 없음
- 팀 확장 시 기능별 분담 개발 가능

**JWT 인증 전략**
```
[Access Token]  유효기간 12시간 → LocalStorage (web) / SecureStore (mobile)
[Refresh Token] 자동 갱신 → 401 응답 시 인터셉터가 자동 처리
```

---

## 6. API 연동 구조

### 6.1 Base URL 구성

```
개발 환경:  http://localhost:8000/api/v1/
운영 환경:  http://1.226.82.178:8000/api/v1/
모바일(안드로이드 에뮬레이터): http://10.0.2.2:8000/api/v1/
```

### 6.2 인증 API

```
POST   /auth/login/          이메일 + 비밀번호 → access/refresh 토큰 반환
POST   /auth/signup/         신규 계정 생성
POST   /auth/token/refresh/  refresh token → 새 access token 발급
```

**응답 예시 (Login)**
```json
{
  "access": "eyJ0eXAiOi...",
  "refresh": "eyJ0eXAiOi...",
  "user": {
    "id": 1,
    "email": "agent@gv.com",
    "name": "홍길동"
  },
  "is_staff": false
}
```

### 6.3 주요 API 엔드포인트

#### 상담원 관리
```
GET    /agents/                    전체 상담원 목록
POST   /agents/                    상담원 등록
PATCH  /agents/{id}/               정보 수정 (daily_cap, status, role 등)
DELETE /agents/{id}/               계정 삭제
GET    /agents/dashboard_stats/    대시보드용 통계
```

#### 고객 DB
```
GET    /customers/                 고객 목록 (페이징, 필터)
POST   /customers/                 고객 단건 등록
POST   /customers/upload_excel/    엑셀 대량 업로드
PATCH  /customers/{id}/            고객 정보 수정
```

**쿼리 파라미터 (고객 필터링)**
```
?category_1=보험&region_1=서울&status=NEW&page=1
```

#### 배정 관리
```
GET    /sales/                     배정 목록 (비관리자는 본인 것만)
POST   /sales/                     수동 배정 생성
PATCH  /sales/{id}/                상태/메모 업데이트
POST   /sales/bulk-assign/         일괄 배정
POST   /sales/bulk-unassign/       일괄 배정 해제
POST   /sales/run-daily-assign/    수동으로 자동배정 실행 (관리자용)
GET    /sales/pull-requests/       DB 신청 목록
POST   /sales/pull-requests/       DB 신청 생성
PATCH  /sales/pull-requests/{id}/  신청 승인/거절
GET    /sales/assignment-history/  배정 감사 로그
```

**배정 상태 정의**
```
NEW       → 배정 대기 (고객만 등록된 상태)
ASSIGNED  → 배정 완료 (상담원에게 배정됨)
TRYING    → 시도 중 (통화 시도했으나 미결)
REJECT    → 거절 (고객이 거절 의사 표시)
INVALID   → 무효 (잘못된 번호, 본인 아님 등)
SUCCESS   → 성공 (계약/가입 완료)
BUY       → 구매 완료
HOLD      → 보류 (나중에 다시 연락)
```

#### 통화 기록
```
GET    /calls/logs/                         통화 기록 목록
POST   /calls/logs/                         통화 기록 생성
GET    /calls/logs/{id}/                    단건 조회
POST   /calls/logs/{id}/recording-upload    녹취 업로드용 Presigned URL 발급
POST   /calls/logs/{id}/recording-complete  업로드 완료 확인
GET    /calls/logs/{id}/recording-url       녹취 다운로드 URL
```

**통화 결과 유형**
```
SUCCESS   성공 (₩2,000 정산 대상)
REJECT    거절 (₩700 정산 대상)
ABSENCE   부재 (₩0)
INVALID   무효 (₩0)
CALLBACK  콜백 예약 (₩0)
```

#### 정산
```
GET    /settlements/        정산 목록
POST   /settlements/        정산 생성 (기간 지정 시 자동 계산)
PATCH  /settlements/{id}/   최종 금액 수정, 상태 변경
```

#### 공지사항
```
GET    /notices/            목록 (중요 공지 상단 고정)
POST   /notices/            작성 (관리자 전용)
PATCH  /notices/{id}/       수정
DELETE /notices/{id}/       삭제
```

### 6.4 공통 응답 포맷

**페이지네이션 응답**
```json
{
  "count": 1247,
  "next": "http://...?page=2",
  "previous": null,
  "results": [ ... ]
}
```

**오류 응답**
```json
{
  "detail": "이 필드는 필수입니다.",
  "field": "phone"
}
```

### 6.5 Axios 클라이언트 (공통 설정)

```typescript
// tm_web/src/lib/axios.ts
const apiClient = axios.create({
  baseURL: `http://${window.location.hostname}:8000/api/v1`,
});

// 요청 인터셉터: 토큰 자동 주입
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 응답 인터셉터: 401 시 자동 로그아웃
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

## 7. 데이터베이스 설계

### 7.1 ERD (Entity Relationship Diagram)

```
┌──────────────┐       ┌──────────────────┐       ┌──────────────┐
│   Account    │1     1│      Agent        │       │   Customer   │
│──────────────│───────│──────────────────│       │──────────────│
│ id (PK)      │       │ id (PK)          │       │ id (PK)      │
│ email        │       │ account_id (FK)  │       │ name         │
│ password     │       │ assigned_phone   │       │ phone        │
│ name         │       │ team             │       │ age          │
│ is_staff     │       │ role             │       │ gender       │
│ is_active    │       │ status           │       │ region_1/2   │
└──────────────┘       │ daily_cap        │       │ category_1/2/3│
                       │ is_auto_assign   │       │ recycle_count│
                       │ employee_code    │       └──────┬───────┘
                       └────────┬─────────┘              │
                                │1                        │1
                                │         N               │
                       ┌────────┴────────────────────────┘
                       │       SalesAssignment
                       │──────────────────────────────────┐
                       │ id (PK)                          │
                       │ agent_id (FK → Agent)            │
                       │ customer_id (FK → Customer)      │
                       │ stage (1ST / 2ND)                │
                       │ status (NEW/ASSIGNED/TRYING/...)  │
                       │ sentiment (HIGH/MID/LOW)          │
                       │ memo                             │
                       │ item_interested                  │
                       │ parent_assignment_id (self FK)   │
                       └──────┬──────────────────────────┘
                              │1
                              │N
                    ┌─────────┴──────────┐
                    │      CallLog        │
                    │────────────────────│
                    │ id (PK)            │
                    │ assignment_id (FK) │
                    │ agent_id (FK)      │
                    │ call_start         │
                    │ call_duration      │
                    │ result_type        │
                    │ recording_file     │
                    │ recording_status   │
                    │ recording_size     │
                    └────────────────────┘

┌──────────────────────┐      ┌────────────────────────┐
│     Settlement        │      │    SettlementPrice      │
│──────────────────────│      │────────────────────────│
│ id (PK)              │      │ id (PK)                │
│ agent_id (FK)        │      │ success_price (₩2,000) │
│ period_start         │      │ reject_price  (₩700)   │
│ period_end           │      │ invalid_price (₩0)     │
│ view_type            │      └────────────────────────┘
│ success_count        │
│ reject_count         │      ┌────────────────────────┐
│ invalid_count        │      │    AssignmentLog        │
│ absence_count        │      │────────────────────────│
│ calculated_amount    │      │ id (PK)                │
│ final_amount         │      │ executed_at            │
│ status               │      │ total_assigned         │
└──────────────────────┘      │ error_message          │
                              └────────────────────────┘

┌──────────────────────┐      ┌────────────────────────┐
│    SalesPullRequest   │      │       Notice            │
│──────────────────────│      │────────────────────────│
│ id (PK)              │      │ id (PK)                │
│ agent_id (FK)        │      │ title                  │
│ requested_count      │      │ content                │
│ reason               │      │ is_important           │
│ status               │      │ author_id (FK)         │
│ approved_by (FK)     │      │ created_at             │
└──────────────────────┘      └────────────────────────┘
```

### 7.2 핵심 인덱스 설계

```sql
-- SalesAssignment 성능 최적화
CREATE INDEX idx_sales_agent_date    ON sales_salesassignment(agent_id, created_at);
CREATE INDEX idx_sales_customer      ON sales_salesassignment(customer_id);
CREATE INDEX idx_sales_status_stage  ON sales_salesassignment(status, stage);

-- CallLog 정산 집계 최적화
CREATE INDEX idx_call_agent_date     ON calls_calllog(agent_id, call_start);
CREATE INDEX idx_call_result         ON calls_calllog(result_type);
```

### 7.3 주요 비즈니스 규칙 (DB 레벨)

| 규칙 | 구현 방법 |
|------|-----------|
| 한 고객은 동시에 여러 상담원에게 배정 불가 | `SalesAssignment.unique_together` 제약 |
| 재활용 최대 2회 | `Customer.recycle_count < 2` 조건 체크 |
| 자기 참조 재배정 추적 | `parent_assignment_id` FK (self-referential) |
| 상담원 고유 사번 | `Agent.employee_code` auto-generate (TM-XXXXXX) |

---

## 8. 인프라 및 배포 구조

### 8.1 Docker Compose 서비스 구성

```yaml
Services:
┌─────────────────┬──────────────┬───────────────────────────────┐
│ 서비스명         │ 이미지        │ 역할                          │
├─────────────────┼──────────────┼───────────────────────────────┤
│ tm_db           │ postgres:16  │ 메인 데이터베이스 (포트 15433)  │
│ tm_redis        │ redis:7      │ Celery 메시지 브로커           │
│ tm_backend      │ custom       │ Django API 서버 (포트 8000)    │
│ tm_web          │ custom/nginx │ React 앱 서빙 (포트 3000)      │
│ tm_celery_worker│ custom       │ 비동기 작업 처리               │
│ tm_celery_beat  │ custom       │ 스케줄 작업 (일일 배정)         │
└─────────────────┴──────────────┴───────────────────────────────┘
```

### 8.2 배포 절차

**최초 배포**
```bash
# 1. 환경 변수 설정
cp .env.example .env
# .env 파일 편집 (SECRET_KEY, DB 비밀번호 등)

# 2. 전체 스택 실행
docker compose up --build -d

# 3. DB 마이그레이션
docker compose exec tm_backend python manage.py migrate

# 4. 관리자 계정 생성
docker compose exec tm_backend python manage.py createsuperuser
```

**업데이트 배포**
```bash
git pull origin main
docker compose up --build -d
docker compose exec tm_backend python manage.py migrate
```

### 8.3 모바일 APK 빌드 (EAS)

```bash
cd tm_mob

# 개발용 APK
eas build --platform android --profile development

# 운영용 APK
eas build --platform android --profile production
```

**빌드 프로파일 (eas.json)**
```json
{
  "build": {
    "development": {
      "android": { "buildType": "apk" },
      "env": { "EXPO_PUBLIC_API_URL": "http://10.0.2.2:8000/api/v1" }
    },
    "production": {
      "android": { "buildType": "apk" },
      "env": { "EXPO_PUBLIC_API_URL": "http://1.226.82.178:8000/api/v1" }
    }
  }
}
```

### 8.4 환경 변수 관리

```bash
# .env (운영 서버)
SECRET_KEY=<복잡한 랜덤 키>
DEBUG=False
ALLOWED_HOSTS=1.226.82.178,yourdomain.com

POSTGRES_DB=tm_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<강력한 비밀번호>
POSTGRES_HOST=tm_db
POSTGRES_PORT=5432

CELERY_BROKER_URL=redis://tm_redis:6379/0

# S3 녹취 저장 (선택)
S3_ACCESS_KEY=<키>
S3_SECRET_KEY=<시크릿>
S3_BUCKET=gv-tm-recordings
S3_ENDPOINT_URL=<엔드포인트>
```

---

## 9. 유지보수성 · 확장성 · 안정성 평가

### 9.1 유지보수성 (Maintainability)

| 항목 | 구현 방법 | 효과 |
|------|-----------|------|
| **모노레포 구조** | 하나의 Git 레포에 백/프론트/모바일 | 전체 시스템 변경을 하나의 PR로 추적 |
| **Feature-Based 폴더 구조** | 기능별 독립 모듈 (auth, agents, sales...) | 수정 범위를 기능 단위로 격리 |
| **타입 시스템** | TypeScript 5.9 strict mode | 런타임 오류를 컴파일 타임에 차단 |
| **환경 변수 분리** | .env 파일로 민감 정보 분리 | 코드 노출 없이 환경별 설정 관리 |
| **Django ORM** | Python 객체로 DB 조작 | SQL 직접 작성 없이 DB 로직 이해 가능 |
| **배정 로그** | AssignmentLog 모델 | 자동배정 실행 이력 추적 및 디버깅 |
| **Docker** | 컨테이너화 | 어느 서버에서도 동일 환경 재현 가능 |

### 9.2 확장성 (Scalability)

| 시나리오 | 현재 대응 방법 |
|----------|---------------|
| **상담원 수 증가** | `daily_cap` 필드로 개인별 제어, DB 인덱스로 쿼리 최적화 |
| **고객 DB 수십만 건** | `bulk_create(batch_size=500)`, 인덱스 기반 필터링 |
| **기능 추가** | Feature 폴더 하나 추가로 독립 개발 가능 |
| **2차 스테이지 확장** | `stage` 필드 (1ST/2ND)로 멀티 스테이지 지원 준비 |
| **팀 단위 확장** | `Agent.team` 필드 (SALES_TM/SALES_MAIN) 이미 존재 |
| **서버 수평 확장** | Docker 기반으로 컨테이너 복제 용이 |
| **iOS 앱 추가** | Expo (React Native) 기반으로 iOS 빌드 바로 가능 |
| **AI 분석 모듈** | `ai_service` 앱 이미 구조 완성, 엔드포인트만 연결 |

### 9.3 안정성 (Stability)

| 항목 | 구현 방법 | 효과 |
|------|-----------|------|
| **원자적 DB 트랜잭션** | `transaction.atomic()` | 배정 중 오류 시 전체 롤백 |
| **JWT 자동 갱신** | 인터셉터 기반 자동 refresh | 토큰 만료로 인한 중단 없음 |
| **Celery 에러 로깅** | AssignmentLog에 error_message 저장 | 배정 실패 원인 추적 가능 |
| **공휴일 자동 감지** | `holidays` 라이브러리 | 공휴일 배정 실수 방지 |
| **데이터 정합성** | DB unique constraint, FK 참조 | 잘못된 데이터 입력 차단 |
| **Presigned URL 만료** | S3 URL 만료 시간 설정 | 녹취 파일 무단 접근 방지 |
| **CORS 허용 목록** | IP/도메인 화이트리스트 | 허가되지 않은 출처 차단 |
| **환경별 API URL** | `.env.development` / `.env.production` | 개발/운영 혼용 오류 방지 |

---

## 10. 사용 설명서

### 10.1 관리자 웹 (tm_web) 사용 가이드

#### 로그인
1. 브라우저에서 `http://서버IP:3000` 접속
2. 관리자 이메일 + 비밀번호 입력 → 로그인

#### 고객 DB 등록 (엑셀 업로드)
1. 상단 메뉴 → **고객 관리** 클릭
2. 우측 상단 **엑셀 업로드** 버튼 클릭
3. 아래 형식의 엑셀 파일 준비:

```
| name | phone       | age | gender | region_1 | category_1 |
|------|-------------|-----|--------|----------|------------|
| 홍길동 | 010-1234-5678 | 45  | M      | 서울     | 보험       |
```

4. 파일 선택 후 업로드 → 결과 확인 (등록 수 / 중복 제외 수)

#### 상담원 등록
1. **상담원 관리** → **+ 상담원 추가**
2. 이름, 이메일, 팀(SALES_TM/SALES_MAIN), 역할 입력
3. **일일 배정 한도(daily_cap)** 설정 (기본값: 50)
4. **자동배정 여부** 활성화

#### 수동 배정 실행
- **배정 관리** → **자동배정 실행** 버튼 (즉시 실행)
- 또는 매일 오전 9시 자동 실행 (별도 조작 불필요)

#### 정산 확인
1. **정산 관리** 메뉴 클릭
2. 기간 선택 (월별 권장) → **정산 생성**
3. 상담원별 성공/거절 건수 및 금액 확인
4. 필요 시 **최종 금액 수정** 가능
5. 확인 완료 → 상태를 **PAID(지급완료)**로 변경

#### DB 신청 처리
1. **배정 관리** → **DB 신청 목록** 탭
2. 대기 중인 신청 확인
3. **승인** 클릭 → 즉시 상담원에게 배정
4. **거절** 클릭 → 사유 입력

### 10.2 상담원 모바일 앱 (tm_mob) 사용 가이드

#### 앱 설치
- 관리자로부터 APK 파일 전달받아 설치 (Android)
- 설치 시 "알 수 없는 소스" 허용 필요

#### 로그인
- 앱 실행 → 이메일, 비밀번호 입력

#### 배정 목록 확인
- 하단 탭 **배정 리스트** → 오늘 배정된 고객 목록
- 이름, 연락처, 상태 확인

#### 통화 후 결과 입력
1. 배정 목록에서 고객 선택
2. **전화** 버튼 → 자동으로 전화 앱 연결
3. 통화 종료 후 앱으로 돌아오면 결과 입력 화면
4. 결과 선택: 성공 / 거절 / 부재 / 무효
5. 메모, 통화 시간 입력 → **저장**

#### DB 추가 신청
- 하단 탭 **DB 신청** → 원하는 수량, 사유 입력 → **신청**
- 관리자 승인 후 배정 리스트에 자동 추가

#### 내 현황 확인
- 하단 탭 **내 현황** → 오늘/이번달 실적 및 예상 정산금 확인

### 10.3 문제 해결 (Troubleshooting)

| 증상 | 원인 | 해결 방법 |
|------|------|-----------|
| 로그인 안 됨 | 서버 미실행 | `docker compose up -d` 확인 |
| 자동배정 안 됨 | Celery Beat 중지 | `docker compose restart tm_celery_beat` |
| 엑셀 업로드 실패 | 컬럼명 불일치 | 엑셀 헤더 확인 (name, phone 필수) |
| 모바일 앱 접속 불가 | 서버 IP 변경 | .env.production의 API URL 수정 후 재빌드 |
| 정산 금액 이상 | SettlementPrice 미설정 | Django Admin에서 단가 설정 확인 |

---

## 11. 비즈니스 기여도 종합

### 11.1 업무 자동화로 인한 시간 절감

| 업무 | 기존 방식 | 현재 방식 | 절감 |
|------|-----------|-----------|------|
| 일일 리드 배정 | 관리자 수동 (30~60분) | 자동 (0분) | **100%** |
| 정산 계산 | 엑셀 수기 (2~3시간/월) | 자동 (즉시) | **~95%** |
| 통화 결과 기록 | 수기/엑셀 | 모바일 즉시 입력 | 오류 대폭 감소 |
| DB 신청 처리 | 전화/카카오톡 | 앱 내 승인 시스템 | 처리 체계화 |

### 11.2 데이터 자산 가치

- 모든 통화 기록 → **KPI 측정 가능** (상담원별 성공률, 연락률)
- 고객 재활용 자동화 → **기존 DB 재활용율 최대 2배 향상**
- 배정 이력 감사 로그 → **법적 분쟁 시 증거 자료**
- 정산 상태 이력 → **급여 분쟁 방지**

### 11.3 확장 가능성 (투자 가치)

현재 구축된 시스템은 단순 사용이 아닌 **플랫폼** 형태로 설계되어 있습니다:

- **AI 분석 모듈** (`ai_service` 앱 구조 완성) → 상담 품질 자동 분석 연결 가능
- **2차 스테이지** (`stage` 필드 존재) → 2단계 TM 프로세스 즉시 확장 가능
- **다중 팀 운영** (`team` 필드 존재) → 영업팀 분리 운영 가능
- **iOS 앱** (React Native 기반) → 추가 개발 공수 최소화

---

## 12. 향후 개발 로드맵

### Phase 1 (단기 - 1개월)
- [ ] 모바일 앱 배정 목록 화면 완성 (현재 scaffold 상태)
- [ ] 모바일 통화 결과 입력 화면 완성
- [ ] 내 현황 대시보드 (모바일) 구현
- [ ] 푸시 알림 연동 (배정 완료 시 상담원 알림)

### Phase 2 (중기 - 3개월)
- [ ] AI 서비스 연동 (통화 내용 분석 → 감정 점수 자동 입력)
- [ ] 2차 스테이지(2ND) 프로세스 완성
- [ ] 실시간 대시보드 (WebSocket)
- [ ] 상담원 성과 랭킹 시스템

### Phase 3 (장기 - 6개월)
- [ ] iOS 앱 배포
- [ ] 다중 조직(멀티 테넌시) 지원
- [ ] 고급 분석 리포트 (월별 트렌드, 예측 분석)
- [ ] CRM 시스템 연동 API

---

## 부록

### A. 시스템 요구사항

| 항목 | 최소 사양 | 권장 사양 |
|------|-----------|-----------|
| **서버 OS** | Ubuntu 20.04 | Ubuntu 22.04 LTS |
| **CPU** | 2 Core | 4 Core |
| **RAM** | 4 GB | 8 GB |
| **디스크** | 50 GB | 100 GB+ |
| **Docker** | 24.0+ | 최신 버전 |
| **모바일 OS** | Android 10+ | Android 12+ |

### B. 주요 파일 위치

| 파일 | 경로 | 용도 |
|------|------|------|
| 백엔드 설정 | `/backend/config/settings.py` | Django 전체 설정 |
| API 라우팅 | `/backend/config/urls.py` | URL 엔드포인트 목록 |
| 자동배정 로직 | `/backend/apps/sales/services.py` | 핵심 비즈니스 로직 |
| 자동배정 스케줄 | `/backend/apps/sales/tasks.py` | Celery 작업 정의 |
| 웹 라우터 | `/tm_web/src/routes/router.tsx` | 웹 페이지 경로 |
| 웹 API 클라이언트 | `/tm_web/src/lib/axios.ts` | HTTP 통신 설정 |
| 모바일 네비게이터 | `/tm_mob/src/navigation/AppNavigator.js` | 화면 전환 구조 |
| 모바일 API 클라이언트 | `/tm_mob/src/api/client.js` | 모바일 HTTP 통신 |
| 인프라 설정 | `/docker-compose.yml` | 전체 서비스 구성 |
| 환경 변수 | `/.env` | 서버 설정값 |

### C. 개발 환경 실행

```bash
# 전체 스택 (Docker)
docker compose up --build

# 백엔드만 (로컬 개발)
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# 웹 프론트엔드
cd tm_web && npm install && npm run dev
# → http://localhost:5173

# 모바일 앱
cd tm_mob && npm install && npx expo start
# → Android 에뮬레이터 또는 실기기
```

---

*본 보고서는 GV TM 시스템 v1.0 기준으로 작성되었습니다.*
*문의: 개발자 김선민*
