from django.apps import AppConfig

class UsersConfig(AppConfig):
    defualt_auto_field = 'django.db.modles.BigAutoField'
    # 실제 파이썬 경로
    name = 'apps.users' # 나 사실 apps 폴더 안에 살아

    # DB나 관계설정에서 부를 별명
    label = 'users'

    #관리자 페이지에 띄울 예쁜이름
    verbose_name = "상담원 및 유저 관리"
    def ready(self):
            # 앱이 시작될 때 시그널을 로드함
            import apps.users.signals