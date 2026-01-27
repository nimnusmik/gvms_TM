# backend/Dockerfile

# 1. 파이썬 3.13 슬림 버전 사용 (가볍고 빠름)
FROM python:3.12-slim

# 2. 환경 변수 설정
# - PYTHONDONTWRITEBYTECODE: 파이썬 .pyc 파일 생성 금지 (디스크 절약)
# - PYTHONUNBUFFERED: 로그가 버퍼링 없이 즉시 출력되도록 설정 (디버깅 용이)
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8

# 3. 작업 디렉토리 설정
WORKDIR /app

# 4. 시스템 의존성 설치 (PostgreSQL 연결 등을 위해 필요)
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# 5. 라이브러리 설치
# requirements.txt만 먼저 복사해서 캐시를 활용 (빌드 속도 최적화)
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# 6. 소스 코드 복사
COPY . /app/

# 7. 실행 명령어 (Docker Compose에서 덮어쓸 수 있음)
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]