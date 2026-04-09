from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth import get_user_model

from .models import Permission, Role, RolePermission

User = get_user_model()


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    """Custom admin for the User model."""

    list_display = (
        'email', 'username', 'first_name', 'last_name', 'phone',
        'role', 'is_staff', 'is_active', 'last_login_at'
    )
    list_filter = ('is_staff', 'is_active', 'groups')
    search_fields = ('email', 'username', 'first_name', 'last_name', 'phone')
    ordering = ('-date_joined',)


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_active', 'updated_at')
    search_fields = ('name',)
    list_filter = ('is_active',)


@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    list_display = ('module', 'action', 'created_at')
    search_fields = ('module', 'action')
    list_filter = ('module',)


@admin.register(RolePermission)
class RolePermissionAdmin(admin.ModelAdmin):
    list_display = ('role', 'permission')
    search_fields = ('role__name', 'permission__module', 'permission__action')
