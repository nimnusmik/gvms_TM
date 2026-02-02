from rest_framework import viewsets, permissions
from .models import Notice
from .serializers import NoticeSerializer

class NoticeViewSet(viewsets.ModelViewSet):
    # 최신순 5개만 가져오는 API 등은 get_queryset이나 별도 action으로 처리 가능하지만
    # 일단 기본 CRUD로 갑니다.
    queryset = Notice.objects.all()
    serializer_class = NoticeSerializer
    permission_classes = [permissions.IsAuthenticated] # 로그인한 사람만
    
    pagination_class = None
    
    def perform_create(self, serializer):
        serializer.save(author=self.request.user)