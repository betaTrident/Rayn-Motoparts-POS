from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.urls import reverse
from rest_framework.test import APITestCase

from .models import Permission, Role, RolePermission
from .rbac import sync_user_group_for_role


User = get_user_model()


class UserManagementApiTests(APITestCase):
    def setUp(self):
        self.superadmin_role = Role.objects.create(name="superadmin", description="System owner")
        self.admin_role = Role.objects.create(name="admin", description="Store admin")
        self.staff_role = Role.objects.create(name="staff", description="Staff")

        for name in ["superadmin", "admin", "staff"]:
            Group.objects.create(name=name)

        permissions = [
            ("users", "read"),
            ("users", "create"),
            ("users", "update"),
            ("users", "deactivate"),
            ("users", "reset_password"),
            ("roles", "read"),
            ("roles", "update_permissions"),
        ]
        self.permission_map = {}
        for module, action in permissions:
            permission = Permission.objects.create(module=module, action=action)
            self.permission_map[f"{module}:{action}"] = permission

        for role in [self.superadmin_role, self.admin_role]:
            for permission in self.permission_map.values():
                RolePermission.objects.create(role=role, permission=permission)

        self.superadmin = self._create_user("super@example.com", self.superadmin_role)
        self.admin = self._create_user("admin@example.com", self.admin_role)
        self.staff = self._create_user("staff@example.com", self.staff_role)

    def _create_user(self, email, role):
        user = User.objects.create_user(
            email=email,
            username=email.split("@")[0],
            first_name="Test",
            last_name="User",
            password="StrongPass123!",
            role=role,
            is_staff=role.name in {"superadmin", "admin"},
            is_superuser=role.name == "superadmin",
        )
        sync_user_group_for_role(user)
        return user

    def test_admin_can_create_staff(self):
        self.client.force_authenticate(self.admin)
        response = self.client.post(
            reverse("auth-users"),
            {
                "email": "newstaff@example.com",
                "username": "newstaff",
                "first_name": "New",
                "last_name": "Staff",
                "role": "staff",
                "password": "StrongPass123!",
                "is_active": True,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["role"], "staff")

    def test_admin_cannot_create_admin(self):
        self.client.force_authenticate(self.admin)
        response = self.client.post(
            reverse("auth-users"),
            {
                "email": "newadmin@example.com",
                "username": "newadmin",
                "first_name": "New",
                "last_name": "Admin",
                "role": "admin",
                "password": "StrongPass123!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 403)

    def test_admin_cannot_edit_superadmin(self):
        self.client.force_authenticate(self.admin)
        response = self.client.patch(
            reverse("auth-user-detail", kwargs={"user_id": self.superadmin.id}),
            {"first_name": "Changed"},
            format="json",
        )

        self.assertEqual(response.status_code, 403)

    def test_staff_cannot_access_user_management(self):
        self.client.force_authenticate(self.staff)
        response = self.client.get(reverse("auth-users"))

        self.assertEqual(response.status_code, 403)

    def test_self_deactivation_is_rejected(self):
        self.client.force_authenticate(self.admin)
        response = self.client.patch(
            reverse("auth-user-detail", kwargs={"user_id": self.admin.id}),
            {"is_active": False},
            format="json",
        )

        self.assertEqual(response.status_code, 403)

    def test_role_permission_update_is_superadmin_only(self):
        self.client.force_authenticate(self.admin)
        response = self.client.patch(
            reverse("auth-role-permissions", kwargs={"role_id": self.staff_role.id}),
            {"permissions": ["users:read"]},
            format="json",
        )

        self.assertEqual(response.status_code, 403)

        self.client.force_authenticate(self.superadmin)
        response = self.client.patch(
            reverse("auth-role-permissions", kwargs={"role_id": self.staff_role.id}),
            {"permissions": ["users:read"]},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("users:read", response.data["permissions"])
