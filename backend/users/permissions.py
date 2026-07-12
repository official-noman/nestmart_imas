from rest_framework.permissions import SAFE_METHODS, BasePermission

from .models import CustomUser


class HasRole(BasePermission):
    """Base class for role-gated permissions. Subclass and set `allowed_roles`."""

    allowed_roles = ()

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and user.role in self.allowed_roles
        )


class IsAccountant(HasRole):
    """Admins and Accountants: manage invoices, payments, and the ledger."""

    allowed_roles = (CustomUser.Role.ADMIN, CustomUser.Role.ACCOUNTANT)


class IsAdminOrReadOnly(BasePermission):
    """Any authenticated user may read; only Admins may write."""

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if request.method in SAFE_METHODS:
            return True
        return user.role == CustomUser.Role.ADMIN
