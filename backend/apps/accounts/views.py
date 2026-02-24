from rest_framework import viewsets, generics
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import Account, MemberLevel
from .serializers import (
    AccountSerializer, 
    AccountCreateSerializer, 
    CustomTokenObtainPairSerializer,
    LevelSerializer,
    UserRegistrationSerializer
)
from django.contrib.auth import get_user_model
from apps.agents.permissions import IsAdminOrManager

#####################################로그인#####################################

# 1. 로그인 뷰
class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

# 2. 계정 관리 CRUD
class AccountViewSet(viewsets.ModelViewSet):
    queryset = Account.objects.all().order_by('-created_at')
    # 조건문 
    permission_classes = [IsAdminOrManager]
    serializer_class = AccountSerializer
    
# 3. 등급 관리 CRUD (관리자용)
class LevelViewSet(viewsets.ModelViewSet):
    queryset = MemberLevel.objects.all()
    serializer_class = LevelSerializer
    permission_classes = [IsAdminOrManager]

#####################################회원가입#####################################

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,) # 로그인 안 한 사람도 가입은 할 수 있어야 함
    serializer_class = UserRegistrationSerializer
