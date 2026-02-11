from rest_framework import serializers
from .models import Customer

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = [
            'id', 
            'name', 
            'phone', 
            'age', 
            'gender', 
            'region', 
            'category_1', 
            'category_2',
            'category_3',
            'region_1',
            'region_2',
            'recycle_count',  # 재활용 횟수
            'created_at',
            'updated_at'
        ]
