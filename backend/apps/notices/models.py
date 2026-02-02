from django.db import models
from django.conf import settings

class Notice(models.Model):
    title = models.CharField(max_length=200, verbose_name="제목")
    content = models.TextField(verbose_name="내용")
    is_important = models.BooleanField(default=False, verbose_name="중요 공지(상단 고정)")
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, verbose_name="작성자")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="작성일")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="수정일")

    class Meta:
        ordering = ['-is_important', '-created_at'] # 중요 공지 우선, 그 다음 최신순
        db_table = 'tm_notices'

    def __str__(self):
        return self.title