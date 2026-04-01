from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Custom user model extending Django's AbstractUser."""

    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=30, null=True, blank=True)
    pin_hash = models.CharField(max_length=255, null=True, blank=True)
    warehouse = models.ForeignKey(
        'inventory.Warehouse',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='users',
    )
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    last_login_at = models.DateTimeField(null=True, blank=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']

    class Meta:
        db_table = 'users'
        ordering = ['-date_joined']

    def __str__(self):
        return self.email
