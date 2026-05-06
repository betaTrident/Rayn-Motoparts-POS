from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import Permission, Role
from .rbac import (
    ADMIN_ROLE,
    STAFF_ROLE,
    SUPERADMIN_ROLE,
    get_effective_permission_keys,
    get_user_role_name,
    role_permissions_payload,
    sync_user_group_for_role,
)

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""

    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'},
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
    )

    class Meta:
        model = User
        fields = (
            'id', 'email', 'username', 'first_name',
            'last_name', 'password', 'password_confirm',
        )
        read_only_fields = ('id',)

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError(
                {'password_confirm': "Passwords do not match."}
            )
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user


class LoginSerializer(serializers.Serializer):
    """Serializer for user login (email + password)."""

    email = serializers.EmailField(required=True)
    password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'},
    )


class UserSerializer(serializers.ModelSerializer):
    """Serializer for reading/updating user profile."""

    role = serializers.SerializerMethodField()
    permissions = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id', 'email', 'username', 'first_name',
            'last_name', 'phone', 'last_login_at', 'deleted_at',
            'is_active', 'is_staff', 'date_joined', 'role', 'permissions',
        )
        read_only_fields = ('id', 'email', 'is_active', 'is_staff', 'date_joined')

    def get_role(self, user):
        return get_user_role_name(user)

    def get_permissions(self, user):
        return get_effective_permission_keys(user)


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for changing user password."""

    old_password = serializers.CharField(
        required=True, write_only=True, style={'input_type': 'password'}
    )
    new_password = serializers.CharField(
        required=True,
        write_only=True,
        validators=[validate_password],
        style={'input_type': 'password'},
    )
    new_password_confirm = serializers.CharField(
        required=True, write_only=True, style={'input_type': 'password'}
    )

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError(
                {'new_password_confirm': "New passwords do not match."}
            )
        return attrs

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is incorrect.")
        return value


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """SimpleJWT serializer that embeds role context in tokens."""

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        role = get_user_role_name(user)
        roles = [role] if role else []
        token['role'] = role
        token['roles'] = roles
        token['permissions'] = get_effective_permission_keys(user)
        return token


class ManagedUserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    permissions = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id', 'email', 'username', 'first_name', 'last_name', 'full_name',
            'phone', 'role', 'permissions', 'is_active', 'is_staff',
            'is_superuser', 'last_login_at', 'deleted_at', 'date_joined',
            'updated_at',
        )
        read_only_fields = fields

    def get_role(self, user):
        return get_user_role_name(user)

    def get_permissions(self, user):
        return get_effective_permission_keys(user)

    def get_full_name(self, user):
        return user.get_full_name() or user.username


class ManagedUserCreateSerializer(serializers.Serializer):
    email = serializers.EmailField()
    username = serializers.CharField(max_length=150)
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    phone = serializers.CharField(max_length=30, required=False, allow_blank=True, allow_null=True)
    role = serializers.ChoiceField(choices=[ADMIN_ROLE, STAFF_ROLE])
    password = serializers.CharField(write_only=True, validators=[validate_password])
    is_active = serializers.BooleanField(required=False, default=True)

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value

    def validate_role(self, value):
        if not Role.objects.filter(name=value, is_active=True).exists():
            raise serializers.ValidationError("Selected role is not available.")
        return value

    def create(self, validated_data):
        role_name = validated_data.pop('role')
        role = Role.objects.get(name=role_name, is_active=True)
        password = validated_data.pop('password')
        user = User.objects.create_user(
            **validated_data,
            password=password,
            role=role,
            is_staff=role_name in {SUPERADMIN_ROLE, ADMIN_ROLE},
        )
        sync_user_group_for_role(user)
        return user


class ManagedUserUpdateSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=150, required=False)
    last_name = serializers.CharField(max_length=150, required=False)
    username = serializers.CharField(max_length=150, required=False)
    phone = serializers.CharField(max_length=30, required=False, allow_blank=True, allow_null=True)
    role = serializers.ChoiceField(choices=[ADMIN_ROLE, STAFF_ROLE], required=False)
    is_active = serializers.BooleanField(required=False)

    def validate_username(self, value):
        user = self.context.get('user')
        queryset = User.objects.filter(username__iexact=value)
        if user is not None:
            queryset = queryset.exclude(pk=user.pk)
        if queryset.exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value

    def validate_role(self, value):
        if not Role.objects.filter(name=value, is_active=True).exists():
            raise serializers.ValidationError("Selected role is not available.")
        return value

    def update(self, instance, validated_data):
        role_name = validated_data.pop('role', None)
        for field, value in validated_data.items():
            setattr(instance, field, value)

        if role_name:
            instance.role = Role.objects.get(name=role_name, is_active=True)
            instance.is_staff = role_name in {SUPERADMIN_ROLE, ADMIN_ROLE}

        instance.save()
        sync_user_group_for_role(instance)
        return instance


class ResetManagedUserPasswordSerializer(serializers.Serializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])


class PermissionSerializer(serializers.ModelSerializer):
    key = serializers.SerializerMethodField()

    class Meta:
        model = Permission
        fields = ('id', 'key', 'module', 'action', 'description')

    def get_key(self, permission):
        return f"{permission.module}:{permission.action}"


class RoleSerializer(serializers.ModelSerializer):
    permissions = serializers.SerializerMethodField()
    user_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Role
        fields = ('id', 'name', 'description', 'is_active', 'permissions', 'user_count')

    def get_permissions(self, role):
        return role_permissions_payload(role)


class RolePermissionsUpdateSerializer(serializers.Serializer):
    permissions = serializers.ListField(
        child=serializers.CharField(),
        allow_empty=True,
    )
