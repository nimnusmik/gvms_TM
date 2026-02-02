# apps/notices/apps.py
# Django가 "이 앱의 진짜 이름이 notices인지 apps.notices인지" 헷갈려하는 상황입니다. apps.py 파일의 설정을 폴더 구조에 맞게 바꿔주면 해결됩니다
from django.apps import AppConfig

class NoticesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    # 👇 기존 'notices'를 아래처럼 수정해주세요!
    name = 'apps.notices' 
    verbose_name = '공지사항'