from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as CustomUserAdmin

from .models import CustomUser


@admin.register(CustomUser)
class CustomUserAdmin(CustomUserAdmin):
    fieldsets = CustomUserAdmin.fieldsets + (
        ('Role Information', {'fields': ('role',)}),
    )
    add_fieldsets = CustomUserAdmin.add_fieldsets + (
        ('Role Information', {'fields': ('role',)}),
    )
    list_display = ('email', 'username', 'role', 'is_staff', 'is_active')
    list_filter = ('role', 'is_staff', 'is_active')
    search_fields = ('email', 'username')
    ordering = ('email',)
