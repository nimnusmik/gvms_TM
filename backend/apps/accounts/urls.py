from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LoginView, AccountViewSet, LevelViewSet, RegisterView


router = DefaultRouter()

#router.register(...): r'accounts': "주소창에 accounts라고 치면..."
# AccountViewSet: "...AccountViewSet에 있는 기능들과 연결해 줘."
router.register(r'accounts', AccountViewSet) # /api/v1/accounts/
router.register(r'levels', LevelViewSet)     # /api/v1/levels/

urlpatterns = [
    # "누군가 .../login/ 주소로 들어오면,"LoginView.as_view(): "LoginView 클래스를 실행해."
    # router가 자동으로 만든 주소들(accounts, levels)도 여기에 몽땅 포함시켜줘
    path('login/', LoginView.as_view(), name='login'),
    path('signup/', RegisterView.as_view(), name='signup'),
    path('', include(router.urls)),
]

