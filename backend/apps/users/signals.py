# apps/users/signals.py

from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import User, AgentProfile

@receiver(post_save, sender=User)
def create_agent_profile(sender, instance, created, **kwargs):
    """
    유저가 생성(created)될 때, 
    그 유저의 역할이 'AGENT(상담원)'라면 빈 프로필을 자동 생성한다.
    """
    if created and instance.role == User.Role.AGENT:
        AgentProfile.objects.create(user=instance)

        #나중에 관리자기능도