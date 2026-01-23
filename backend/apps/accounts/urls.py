from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LoginView, AccountViewSet, LevelViewSet, RegisterView

router = DefaultRouter()
router.register(r'accounts', AccountViewSet) # /api/v1/accounts/
router.register(r'levels', LevelViewSet)     # /api/v1/levels/

urlpatterns = [
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/signup/', RegisterView.as_view(), name='signup'),
    path('', include(router.urls)),
]