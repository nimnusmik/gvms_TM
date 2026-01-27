from django.conf import settings 
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Account 

@receiver(post_save, sender=Account) # Sender도 Account로 변경
def create_profile(sender, instance, created, **kwargs):
    pass
    # if created:
    #     AgentProfile.objects.create(user=instance)