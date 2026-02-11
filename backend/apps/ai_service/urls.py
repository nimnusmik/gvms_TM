# apps/ai_service/urls.py
from django.urls import path
from .views import chat_with_ai

# 시니어의 조언: 
# 단일 기능을 수행하는 API는 Router보다 path를 직접 사용하는 것이 
# 가독성 면에서도 좋고 아키텍처적으로도 더 가볍습니다.

urlpatterns = [
    # 1. 'ask/' 경로로 들어오는 요청을 chat_with_ai 함수와 연결해.
    # 2. name='chat_with_ai'는 나중에 코드 내에서 이 URL을 참조할 때 사용하는 별명이야.
    path('ask/', chat_with_ai, name='chat_with_ai'),
]