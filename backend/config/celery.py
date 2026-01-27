import os
from celery import Celery

# Django의 settings 모듈을 Celery의 기본 설정으로 지정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings') # 'config'는 본인 프로젝트명으로 변경

app = Celery('tm_project') # 프로젝트명

# 문자열로 등록한 설정은 Celery 설정 파일에서 'CELERY_'로 시작하는 키를 읽음
app.config_from_object('django.conf:settings', namespace='CELERY')

# 등록된 장고 앱 설정에서 task를 자동으로 불러옴
app.autodiscover_tasks()