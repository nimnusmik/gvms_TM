from .celery import app as celery_app

__all__ = ('celery_app',) # Django가 켜질 때 Celery도 같이 로드되도록