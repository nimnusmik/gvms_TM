from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import Account, MemberLevel
from .serializers import (
    AccountSerializer, 
    AccountCreateSerializer, 
    CustomTokenObtainPairSerializer,
    LevelSerializer
)

# 1. 로그인 뷰
class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

# 2. 계정 관리 CRUD
class AccountViewSet(viewsets.ModelViewSet):
    queryset = Account.objects.all().order_by('-created_at')
    
    def get_permissions(self):
        if self.action == 'create':
            return [AllowAny()] # 회원가입은 누구나? (정책에 따라 IsAuthenticated로 변경)
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == 'create':
            return AccountCreateSerializer
        return AccountSerializer

# 3. 등급 관리 CRUD (관리자용)
class LevelViewSet(viewsets.ModelViewSet):
    queryset = MemberLevel.objects.all()
    serializer_class = LevelSerializer
    permission_classes = [IsAuthenticated]