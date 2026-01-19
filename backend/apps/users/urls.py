# apps/users/urls.py
from django.urls import path
from .views import AgentLoginView

urlpatterns = [
    path('auth/login', AgentLoginView.as_view(), name='auth_login'),
]