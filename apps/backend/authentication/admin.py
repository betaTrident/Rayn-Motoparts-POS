from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth import get_user_model

User = get_user_model()


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    """Custom admin for the User model."""

    list_display = (
        'email', 'username', 'first_name', 'last_name', 'phone',
        'warehouse', 'is_staff', 'is_active', 'last_login_at'
    )
    list_filter = ('is_staff', 'is_active', 'groups')
    search_fields = ('email', 'username', 'first_name', 'last_name', 'phone')
    ordering = ('-date_joined',)
