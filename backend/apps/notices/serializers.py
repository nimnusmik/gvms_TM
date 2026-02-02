from rest_framework import serializers
from .models import Notice

class NoticeSerializer(serializers.ModelSerializer):
    author_name = serializers.ReadOnlyField(source='author.name') # 작성자 이름 표시

    class Meta:
        model = Notice
        fields = ['id', 'title', 'content', 'is_important', 'author_name', 'created_at']