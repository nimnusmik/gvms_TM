from django.db import models

class BaseModel(models.Model):
    """
    모든 모델의 부모가 될 클래스
    - 생성시간, 수정시간 자동 관리
    - is_deleted 필드로 데이터 보존 (Soft Delete)
    """
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="생성일시")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="수정일시")
    is_deleted = models.BooleanField(default=False, verbose_name="삭제여부")

    class Meta:
        abstract = True  # DB에 테이블을 만들지 않고 상속만 해줌 (중요!)