from rest_framework.permissions import BasePermission
from .models import AgentRole


class IsAdminOrManager(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser:
            return True
        agent = getattr(user, "agent_profile", None)
        if not agent:
            return False
        return agent.role in [AgentRole.ADMIN, AgentRole.MANAGER]
