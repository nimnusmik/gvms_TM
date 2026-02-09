from django.db import models

class Customer(models.Model):
    # 1. 기본 정보
    name = models.CharField(max_length=100, verbose_name="고객명")
    phone = models.CharField(max_length=20, unique=True, verbose_name="연락처")
    age = models.IntegerField(null=True, blank=True, verbose_name="나이")
    gender = models.CharField(max_length=10, null=True, blank=True, verbose_name="성별")
    region = models.CharField(max_length=255, null=True, blank=True, verbose_name="지역")
    
    # 2. 엑셀 분류 정보 (검색용)
    category_1 = models.CharField(max_length=50, null=True, blank=True)
    category_2 = models.CharField(max_length=50, null=True, blank=True)
    category_3 = models.CharField(max_length=50, null=True, blank=True)
    region_1 = models.CharField(max_length=50, null=True, blank=True)
    region_2 = models.CharField(max_length=50, null=True, blank=True)

    # 3. 재활용 관리 (세탁 횟수)
    recycle_count = models.IntegerField(default=0, verbose_name="재활용 횟수")

    # 레거시 호환용 상태 필드 (실제 영업 상태는 SalesAssignment에서 관리)
    status = models.CharField(max_length=20, default='NEW', verbose_name="(레거시) 상태")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tm_customers'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.phone})"
