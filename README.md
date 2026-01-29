# GV TM

웹/모바일/백엔드가 함께 있는 모노레포입니다.

## 개요
- `tm_web`: Vite + React 기반 웹 프론트엔드
- `tm_mob`: Expo/React 기반 모바일(또는 웹) 클라이언트
- `backend`: Django + DRF 백엔드
- `docker-compose.yml`: Postgres, Redis, Django, Celery 구성

## 폴더 구조
```
.
├─ backend/           # Django API + Celery
├─ tm_web/            # Vite + React 웹
├─ tm_mob/            # Expo/React 클라이언트
├─ docker-compose.yml
└─ .env               # 로컬 환경 변수
```

## 빠른 시작

### 1) 백엔드 + DB + Redis (Docker)
루트에서 실행:
```
docker compose up --build
```
- Django: http://localhost:8000
- Postgres: localhost:5432
- Redis: localhost:6379

### 2) 웹 프론트엔드 (tm_web)
```
cd tm_web
npm install
npm run dev
```

### 3) 모바일/클라이언트 (tm_mob)
```
cd tm_mob
npm install
npm start
```

## 환경 변수
`docker-compose.yml`에서 아래 환경 변수를 사용합니다. 로컬 `.env`에 세팅하세요.
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_HOST`
- `POSTGRES_PORT`

## 유용한 명령어
- Django 마이그레이션(컨테이너 내부):
```
docker compose exec tm_backend python manage.py migrate
```
- Django 슈퍼유저 생성:
```
docker compose exec tm_backend python manage.py createsuperuser
```

## 참고
- Celery 워커는 `docker-compose.yml`에 포함되어 있습니다.
- `tm_media_data` 볼륨은 백엔드와 워커가 공유합니다.

