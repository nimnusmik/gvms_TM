# GV_TM — 전화 상담(TM) 통합 관리 시스템

웹 관리자 대시보드, 상담원 모바일 앱, Django 백엔드가 함께 있는 모노레포입니다.

---

## 프로젝트 구성

| 디렉토리 | 역할 | 기술 스택 |
|---------|------|---------|
| `backend/` | API 서버 + Celery 비동기 처리 | Django, DRF, PostgreSQL, Redis |
| `tm_web/` | 관리자 웹 대시보드 | React 19, Vite, Tailwind CSS |
| `tm_mob/` | 상담원 모바일 앱 | Expo, React Native |
| `docker-compose.yml` | 전체 서비스 오케스트레이션 | Docker |

---

## 폴더 구조

```
gv_TM/
├── backend/              # Django API + Celery
│   ├── apps/
│   │   ├── accounts/     # 인증/계정 관리
│   │   ├── agents/       # 상담원 관리
│   │   ├── customers/    # 고객 DB
│   │   ├── sales/        # 배정 관리
│   │   ├── calls/        # 통화 기록
│   │   ├── settlements/  # 정산
│   │   └── notices/      # 공지사항
│   └── config/           # Django 설정
├── tm_web/               # 관리자 웹 (React + Vite)
│   └── src/
│       └── features/     # 기능별 모듈
├── tm_mob/               # 상담원 앱 (Expo)
│   └── src/
│       └── screens/      # 화면별 컴포넌트
├── docker-compose.yml
├── .env                  # 환경변수
└── 사용설명서.md
```

---

## 빠른 시작

### 1. 환경변수 설정

`.env` 파일을 프로젝트 루트에 생성합니다:

```env
# Database
POSTGRES_DB=tm_db
POSTGRES_USER=tm_user
POSTGRES_PASSWORD=your_password

# Django
SECRET_KEY=your-django-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# JWT
JWT_SECRET_KEY=your-jwt-secret

# AWS S3 (녹취 파일 저장, 선택사항)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_STORAGE_BUCKET_NAME=
AWS_S3_REGION_NAME=ap-northeast-2
```

### 2. 전체 서비스 실행 (Docker)

```bash
docker compose up --build
```

| 서비스 | 접속 주소 | 설명 |
|-------|---------|------|
| TM_Web (관리자) | http://localhost:3000 | React 관리자 대시보드 |
| Backend API | http://localhost:8000/api/v1/ | Django REST API |
| Django Admin | http://localhost:8000/admin/ | DB 직접 관리 |
| PostgreSQL | localhost:**15433** | 데이터베이스 |

### 3. 초기 설정 (최초 1회)

```bash
# 마이그레이션
docker compose exec tm_backend python manage.py migrate

# 슈퍼유저 생성
docker compose exec tm_backend python manage.py createsuperuser
```

슈퍼유저 생성 후 Django Admin(`/admin/`)에서 **MemberLevel(회원등급)** 을 먼저 등록하세요.

---

## 개발 환경 (로컬 실행)

### 웹 프론트엔드 (tm_web)

```bash
cd tm_web
npm install
npm run dev        # http://localhost:5173
```

### 모바일 앱 (tm_mob)

```bash
cd tm_mob
npm install
npm start          # Expo 개발 서버
```

---

## Docker 서비스 구성

| 컨테이너 | 이미지 | 역할 |
|---------|-------|------|
| `tm_web` | `./tm_web` (nginx) | React 정적 파일 서빙 |
| `tm_backend` | `./backend` | Django API 서버 |
| `tm_postgres` | `postgres:16` | 데이터베이스 |
| `tm_redis` | `redis:7-alpine` | 메시지 큐 / 캐시 |
| `tm_celery_worker` | `./backend` | 비동기 작업 처리 (엑셀 업로드 등) |
| `tm_celery_beat` | `./backend` | 주기적 스케줄러 (자동 배정 등) |

---

## 주요 기능

- **고객 DB 업로드**: 엑셀(.xlsx) 대량 업로드 → Celery 비동기 처리
- **상담원 배정**: 자동/수동/일괄 배정, 일일 한도 제어
- **통화 기록**: 결과 입력 시 배정 상태 자동 변경
- **2차 영업 배정**: 1차 성공 건을 영업팀에 연결
- **정산**: 통화 결과별 단가 자동 계산 및 엑셀 export
- **녹취 관리**: S3 기반 녹취 파일 업로드/다운로드

---

## API 주요 엔드포인트

```
POST   /api/v1/auth/login/                   # 로그인
GET    /api/v1/agents/me/                    # 내 정보
GET    /api/v1/agents/dashboard_stats/       # 대시보드 통계
GET    /api/v1/customers/                    # 고객 목록
POST   /api/v1/customers/upload_excel/       # 엑셀 업로드 (비동기)
GET    /api/v1/sales/                        # 배정 목록
POST   /api/v1/sales/bulk-assign/            # 일괄 배정
POST   /api/v1/sales/{id}/assign-secondary/  # 2차 배정
POST   /api/v1/calls/                        # 통화 기록 생성
GET    /api/v1/settlements/summary/          # 정산 요약
```

---

## 유용한 명령어

```bash
# 전체 로그 확인
docker compose logs -f

# 특정 서비스 재시작
docker compose restart tm_backend
docker compose restart tm_celery_worker

# 마이그레이션 새로 생성
docker compose exec tm_backend python manage.py makemigrations
docker compose exec tm_backend python manage.py migrate

# DB 백업
docker compose exec tm_postgres pg_dump -U tm_user tm_db > backup.sql
```

---

## 참고

- 상세 사용법은 **[사용설명서.md](./docs/사용설명서.md)** 를 참고하세요.
- `tm_media_data` 볼륨은 백엔드(`tm_backend`)와 Celery 워커(`tm_celery_worker`)가 공유합니다.
- Celery Beat은 자동 배정 스케줄 등 주기적 작업에 사용됩니다.
