# apps/users/views.py

from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import CustomTokenObtainPairSerializer

class AgentLoginView(TokenObtainPairView):
    """
    상담원 로그인 뷰
    POST /api/v1/auth/login
    """
    serializer_class = CustomTokenObtainPairSerializer