from django.apps import AppConfig

class AgentsConfig(AppConfig):
    defualt_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.agents'
    verbose_name = '상담원 관리'