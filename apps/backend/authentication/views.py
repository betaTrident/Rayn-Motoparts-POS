from django.core.paginator import Paginator
from django.db import models, transaction
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate, get_user_model
from django.utils import timezone

from core.models import AuditLog
from .models import Permission, Role
from .rbac import (
    ADMIN_ROLE,
    STAFF_ROLE,
    SUPERADMIN_ROLE,
    can_manage_target_user,
    get_manageable_role_names,
    get_user_role_name,
    replace_role_permissions,
    role_permissions_payload,
    sync_user_group_for_role,
    user_has_permission,
    user_is_superadmin,
)
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    UserSerializer,
    ChangePasswordSerializer,
    CustomTokenObtainPairSerializer,
    ManagedUserCreateSerializer,
    ManagedUserSerializer,
    ManagedUserUpdateSerializer,
    PermissionSerializer,
    ResetManagedUserPasswordSerializer,
    RolePermissionsUpdateSerializer,
    RoleSerializer,
)

User = get_user_model()
ALLOWED_SYSTEM_ROLES = {'superadmin', 'admin', 'staff'}


def _require_permission(user, permission_key: str, message: str):
    if user_has_permission(user, permission_key):
        return None
    return Response({'detail': message}, status=status.HTTP_403_FORBIDDEN)


def _parse_page(value):
    try:
        return max(int(value or 1), 1)
    except (TypeError, ValueError):
        return 1


def _parse_page_size(value):
    try:
        return max(1, min(int(value or 20), 100))
    except (TypeError, ValueError):
        return 20


def _audit_user_management_action(request, action, target_user, old_values=None, new_values=None):
    AuditLog.objects.create(
        table_name='users',
        record_pk=str(target_user.pk),
        action=action,
        old_values=old_values,
        new_values=new_values,
        changed_by=request.user,
        ip_address=request.META.get('REMOTE_ADDR'),
        user_agent=(request.META.get('HTTP_USER_AGENT') or '')[:500],
    )


def _visible_users_for_actor(actor):
    queryset = User.objects.select_related('role').order_by('-date_joined')
    if user_is_superadmin(actor):
        return queryset.filter(
            models.Q(role__name__in=[ADMIN_ROLE, STAFF_ROLE])
            | models.Q(groups__name__in=[ADMIN_ROLE, STAFF_ROLE])
        ).distinct()
    if get_user_role_name(actor) == ADMIN_ROLE:
        return queryset.filter(
            models.Q(role__name=STAFF_ROLE) | models.Q(groups__name=STAFF_ROLE)
        ).distinct()
    return queryset.none()


class RegisterView(generics.CreateAPIView):
    """POST /api/auth/register/ — Create a new user account."""

    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        if user.role:
            sync_user_group_for_role(user)
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                'user': UserSerializer(user).data,
                'tokens': {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                },
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    """POST /api/auth/login/ — Authenticate and return JWT tokens."""

    permission_classes = [AllowAny]
    serializer_class = LoginSerializer

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = authenticate(
            request,
            email=serializer.validated_data['email'],
            password=serializer.validated_data['password'],
        )

        if user is None:
            return Response(
                {'detail': 'Invalid email or password.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not user.is_active:
            return Response(
                {'detail': 'Account is disabled.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        role_name = get_user_role_name(user)
        if role_name not in ALLOWED_SYSTEM_ROLES:
            return Response(
                {'detail': 'Account has no system access role.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        user.last_login_at = timezone.now()
        user.save(update_fields=['last_login_at', 'updated_at'])

        refresh = CustomTokenObtainPairSerializer.get_token(user)
        return Response(
            {
                'user': UserSerializer(user).data,
                'tokens': {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                },
            },
            status=status.HTTP_200_OK,
        )


class LogoutView(APIView):
    """POST /api/auth/logout/ — Blacklist the refresh token."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if not refresh_token:
                return Response(
                    {'detail': 'Refresh token is required.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(
                {'detail': 'Successfully logged out.'},
                status=status.HTTP_200_OK,
            )
        except Exception:
            return Response(
                {'detail': 'Invalid or expired token.'},
                status=status.HTTP_400_BAD_REQUEST,
            )


class UserProfileView(generics.RetrieveUpdateAPIView):
    """GET/PUT /api/auth/profile/ — View or update the current user."""

    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class ChangePasswordView(APIView):
    """POST /api/auth/change-password/ — Change user password."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data, context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()
        return Response(
            {'detail': 'Password updated successfully.'},
            status=status.HTTP_200_OK,
        )


class ManagedUserListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        denied = _require_permission(
            request.user,
            'users:read',
            'You do not have access to user management.',
        )
        if denied is not None:
            return denied

        queryset = _visible_users_for_actor(request.user)
        query = (request.query_params.get('q') or '').strip()
        role = (request.query_params.get('role') or '').strip()
        active = (request.query_params.get('active') or '').strip().lower()

        if query:
            queryset = queryset.filter(
                models.Q(email__icontains=query)
                | models.Q(username__icontains=query)
                | models.Q(first_name__icontains=query)
                | models.Q(last_name__icontains=query)
                | models.Q(phone__icontains=query)
            )

        if role in {ADMIN_ROLE, STAFF_ROLE}:
            queryset = queryset.filter(
                models.Q(role__name=role) | models.Q(groups__name=role)
            ).distinct()

        if active in {'true', 'false'}:
            queryset = queryset.filter(is_active=active == 'true')

        page = _parse_page(request.query_params.get('page'))
        page_size = _parse_page_size(request.query_params.get('page_size'))
        paginator = Paginator(queryset, page_size)
        page_obj = paginator.get_page(page)

        stats_base = _visible_users_for_actor(request.user)
        stats = {
            'total': stats_base.count(),
            'active': stats_base.filter(is_active=True).count(),
            'inactive': stats_base.filter(is_active=False).count(),
            'admins': stats_base.filter(models.Q(role__name=ADMIN_ROLE) | models.Q(groups__name=ADMIN_ROLE)).distinct().count(),
            'staff': stats_base.filter(models.Q(role__name=STAFF_ROLE) | models.Q(groups__name=STAFF_ROLE)).distinct().count(),
        }

        return Response(
            {
                'results': ManagedUserSerializer(page_obj.object_list, many=True).data,
                'stats': stats,
                'pagination': {
                    'page': page_obj.number,
                    'pageSize': page_size,
                    'totalCount': paginator.count,
                    'totalPages': paginator.num_pages,
                    'hasPrevious': page_obj.has_previous(),
                    'hasNext': page_obj.has_next(),
                },
            },
            status=status.HTTP_200_OK,
        )

    @transaction.atomic
    def post(self, request):
        denied = _require_permission(
            request.user,
            'users:create',
            'You do not have access to create users.',
        )
        if denied is not None:
            return denied

        requested_role = request.data.get('role')
        if requested_role not in get_manageable_role_names(request.user):
            return Response(
                {'detail': 'You cannot create users with that role.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = ManagedUserCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        _audit_user_management_action(
            request,
            AuditLog.Action.INSERT,
            user,
            new_values={
                'email': user.email,
                'role': get_user_role_name(user),
                'is_active': user.is_active,
            },
        )

        return Response(ManagedUserSerializer(user).data, status=status.HTTP_201_CREATED)


class ManagedUserDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, request, user_id):
        try:
            target = User.objects.select_related('role').get(pk=user_id)
        except User.DoesNotExist:
            return None, Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        if not can_manage_target_user(request.user, target):
            return None, Response(
                {'detail': 'You cannot manage this user.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        return target, None

    def get(self, request, user_id):
        denied = _require_permission(
            request.user,
            'users:read',
            'You do not have access to user management.',
        )
        if denied is not None:
            return denied

        target, error = self.get_object(request, user_id)
        if error is not None:
            return error
        return Response(ManagedUserSerializer(target).data, status=status.HTTP_200_OK)

    @transaction.atomic
    def patch(self, request, user_id):
        denied = _require_permission(
            request.user,
            'users:update',
            'You do not have access to update users.',
        )
        if denied is not None:
            return denied

        target, error = self.get_object(request, user_id)
        if error is not None:
            return error

        old_values = {
            'first_name': target.first_name,
            'last_name': target.last_name,
            'username': target.username,
            'phone': target.phone,
            'role': get_user_role_name(target),
            'is_active': target.is_active,
        }

        requested_role = request.data.get('role')
        if requested_role and requested_role not in get_manageable_role_names(request.user):
            return Response(
                {'detail': 'You cannot assign that role.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        if 'is_active' in request.data and not request.data.get('is_active'):
            denied = _require_permission(
                request.user,
                'users:deactivate',
                'You do not have access to deactivate users.',
            )
            if denied is not None:
                return denied

        serializer = ManagedUserUpdateSerializer(
            target,
            data=request.data,
            partial=True,
            context={'user': target},
        )
        serializer.is_valid(raise_exception=True)
        updated = serializer.save()
        if not updated.is_active and updated.deleted_at is None:
            updated.deleted_at = timezone.now()
            updated.save(update_fields=['deleted_at', 'updated_at'])
        if updated.is_active and updated.deleted_at is not None:
            updated.deleted_at = None
            updated.save(update_fields=['deleted_at', 'updated_at'])

        _audit_user_management_action(
            request,
            AuditLog.Action.UPDATE,
            updated,
            old_values=old_values,
            new_values={
                'first_name': updated.first_name,
                'last_name': updated.last_name,
                'username': updated.username,
                'phone': updated.phone,
                'role': get_user_role_name(updated),
                'is_active': updated.is_active,
            },
        )

        return Response(ManagedUserSerializer(updated).data, status=status.HTTP_200_OK)


class ManagedUserResetPasswordView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, user_id):
        denied = _require_permission(
            request.user,
            'users:reset_password',
            'You do not have access to reset user passwords.',
        )
        if denied is not None:
            return denied

        try:
            target = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        if not can_manage_target_user(request.user, target):
            return Response(
                {'detail': 'You cannot reset this user password.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = ResetManagedUserPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        target.set_password(serializer.validated_data['password'])
        target.save(update_fields=['password', 'updated_at'])

        _audit_user_management_action(
            request,
            AuditLog.Action.UPDATE,
            target,
            new_values={'password_reset': True},
        )

        return Response({'detail': 'Password reset successfully.'}, status=status.HTTP_200_OK)


class RoleListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        denied = _require_permission(
            request.user,
            'roles:read',
            'You do not have access to role settings.',
        )
        if denied is not None:
            return denied

        role_names = [ADMIN_ROLE, STAFF_ROLE]
        if user_is_superadmin(request.user):
            role_names = [SUPERADMIN_ROLE, ADMIN_ROLE, STAFF_ROLE]

        roles = (
            Role.objects.filter(name__in=role_names, is_active=True)
            .annotate(user_count=models.Count('users'))
            .order_by('name')
        )
        return Response({'results': RoleSerializer(roles, many=True).data}, status=status.HTTP_200_OK)


class RolePermissionsView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def patch(self, request, role_id):
        denied = _require_permission(
            request.user,
            'roles:update_permissions',
            'You do not have access to update role permissions.',
        )
        if denied is not None:
            return denied

        if not user_is_superadmin(request.user):
            return Response(
                {'detail': 'Only Superadmin can update role permissions.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            role = Role.objects.get(pk=role_id, is_active=True)
        except Role.DoesNotExist:
            return Response({'detail': 'Role not found.'}, status=status.HTTP_404_NOT_FOUND)

        if role.name == SUPERADMIN_ROLE:
            return Response(
                {'detail': 'Superadmin permissions are managed by system policy.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = RolePermissionsUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        old_permissions = role_permissions_payload(role)
        replace_role_permissions(role, serializer.validated_data['permissions'])

        AuditLog.objects.create(
            table_name='role_permissions',
            record_pk=str(role.pk),
            action=AuditLog.Action.UPDATE,
            old_values={'permissions': old_permissions},
            new_values={'permissions': serializer.validated_data['permissions']},
            changed_by=request.user,
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=(request.META.get('HTTP_USER_AGENT') or '')[:500],
        )

        role = Role.objects.annotate(user_count=models.Count('users')).get(pk=role.pk)
        return Response(RoleSerializer(role).data, status=status.HTTP_200_OK)


class PermissionListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        denied = _require_permission(
            request.user,
            'roles:read',
            'You do not have access to permissions.',
        )
        if denied is not None:
            return denied

        permissions = Permission.objects.order_by('module', 'action')
        grouped = {}
        for item in PermissionSerializer(permissions, many=True).data:
            grouped.setdefault(item['module'], []).append(item)

        return Response(
            {
                'results': PermissionSerializer(permissions, many=True).data,
                'grouped': grouped,
            },
            status=status.HTTP_200_OK,
        )
