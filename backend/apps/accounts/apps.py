#장고가 서버를 켤 때 이 등록증을 보고, "아, apps.account라는 앱이 있구나!" 하고 인식만 함
from django.apps import AppConfig

class AccountConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    
    name = 'apps.accounts' 

    verbose_name = '회원가입 및 계정 관리'