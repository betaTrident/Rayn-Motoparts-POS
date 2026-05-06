# User Management Module Strategic Plan

## Summary
Create this document as the source-of-truth strategy for a complete User Management module in Rayn Motoparts POS.

The module allows Superadmin to manage admins, staff, role presets, permission assignments, and audit visibility. Admin manages staff users only, using approved staff-level role presets. The system uses role presets with a permission matrix for v1, avoiding per-user overrides while still allowing controlled customization of feature access.

This plan builds on the existing Django `User`, `Role`, `Permission`, and `RolePermission` models, the current JWT auth flow, frontend role guards, and the module-first frontend structure.

## Goals
- Deliver a role-based User Management module with strict server-side enforcement.
- Use role presets with a permission matrix for controlled customization.
- Provide Admin and Superadmin workflows with clear scope boundaries.
- Keep auditability and security as first-class requirements.

## Scope Rules
- Superadmin can create, edit, and deactivate admins and staff.
- Superadmin can update role preset permissions.
- Admin can create, edit, and deactivate staff only.
- Admin cannot grant permissions outside staff-approved presets.
- Staff cannot access user management.
- No user can deactivate or demote themselves.
- Superadmin accounts cannot be modified by Admin.

## Backend Architecture
- Add a dedicated user-management API under `/api/auth/users/` or `/api/users/`, protected by backend permission checks.
- Keep Django `User` as the account source of truth, but standardize authorization around custom `Role`, `Permission`, and `RolePermission` tables.
- Align JWT claims with the custom role model rather than relying only on Django groups.
- Keep Django groups only as a compatibility bridge if needed during migration.

### Permission Classes
- `users:read`
- `users:create`
- `users:update`
- `users:deactivate`
- `users:reset_password`
- `roles:read`
- `roles:update_permissions`
- `system:manage_admins`

## Public API Interfaces

### Users
- `GET /api/auth/users/`
	- Supports search, role filter, active status filter, pagination.
	- Returns identity, role, status, last login, created date.
- `POST /api/auth/users/`
	- Creates admin or staff depending on caller scope.
	- Required fields: email, username, first name, last name, role, temporary password or invite mode.
- `GET /api/auth/users/{id}/`
	- Returns user detail, assigned role, effective permissions, account status, audit metadata.
- `PATCH /api/auth/users/{id}/`
	- Updates profile fields, active status, and role assignment within caller scope.
- `POST /api/auth/users/{id}/reset-password/`
	- Allows Superadmin or Admin-with-staff-scope to issue a password reset or temporary password.

### Roles and Permissions
- `GET /api/auth/roles/`
	- Lists role presets and their permissions.
- `PATCH /api/auth/roles/{id}/permissions/`
	- Superadmin-only update of role preset permissions.
- `GET /api/auth/permissions/`
	- Lists all available permissions grouped by module for the permission matrix UI.

## Data Model Strategy
- Use existing `Role`, `Permission`, and `RolePermission` tables as the durable RBAC model.
- Keep three baseline role presets for v1:
	- `superadmin`
	- `admin`
	- `staff`
- Add permissions for user management and any missing frontend modules.
- Treat Superadmin as unrestricted, but still store explicit permissions for auditability and UI rendering.
- Prefer soft deactivation through `is_active = false` and `deleted_at` instead of hard deletes.
- Record user-management actions in audit logs (actor, target user, changed fields, timestamp, request metadata).

## Frontend Architecture
- Add a User Management page under the admin route group for Admin and Superadmin: `/app/admin/users`.
- Hide the page from Staff.
- Show different capabilities by role:
	- Admin view: staff list, staff create/edit, deactivate staff, reset staff password.
	- Superadmin view: admins and staff, role preset permission matrix, sensitive audit context.

### Module Placement
- Page entry under app route structure.
- Module UI under `components/modules/users`.
- Service under `services/modules`.
- React Query hook under `hooks/modules`.
- Add `queryKeys.users` entries for list, detail, roles, and permissions.
- Extend `ENDPOINTS.auth` or add `ENDPOINTS.users` for new routes.
- Extend auth/user types to include role and effective permissions returned from the backend.

## UI/UX Design
- Build a practical admin tool, not a marketing screen.

### Primary Layout
- Top page header with create-user action.
- Compact stat strip for total, active, inactive, admins, staff.
- Filterable user table.
- Detail/edit dialog or side sheet.
- Superadmin-only permission matrix section.

### User Table Columns
- Name
- Email
- Role
- Status
- Last login
- Created date
- Actions

### User Form Fields
- First name
- Last name
- Email
- Username
- Phone
- Role
- Account status
- Temporary password or reset option

### Permission Matrix
- Rows grouped by module.
- Columns/actions such as view, create, update, delete, approve, export, system.
- Disabled cells for permissions outside the role's allowed scope.
- Confirmation dialog before saving role changes.

### UI States
- Loading, empty, error, saving, and permission-denied states.

## Implementation Plan

### 1) Backend RBAC Alignment
- Update token generation so JWT claims include the user's custom role and effective permissions.
- Ensure profile response includes role metadata needed by frontend guards.
- Add a backend permission helper that resolves role permissions from `RolePermission`.
- Keep route protection enforced on the backend even when the frontend hides UI.

### 2) Backend User Management API
- Add serializers for user list, user detail, create user, update user, reset password, role list, permission matrix.
- Add views/viewsets for users, roles, and permissions.
- Add query filtering for user list.
- Add server-side validation for admin/superadmin scope boundaries.
- Add audit events for create, update, deactivate, role change, and reset password.

### 3) RBAC Seed Data
- Extend `seed_rbac_data` with user-management permissions.
- Ensure baseline role presets are created idempotently.
- Assign roles:
	- Superadmin: all permissions.
	- Admin: staff user management plus operational permissions.
	- Staff: operational permissions only.
- Add migration or seed notes for existing users so their role assignments remain valid.

### 4) Frontend Auth and Permission Model
- Extend frontend auth types with role and permissions.
- Update auth service claim parsing to understand backend-provided permissions.
- Upgrade `usePermissions` from role-only checks to role plus permission checks.
- Keep existing `RoleGuard` behavior for route-level protection.
- Use `PermissionGuard` or permission-aware hooks for action-level controls.

### 5) Frontend User Management Module
- Add `/app/admin/users` route guarded for Admin and Superadmin.
- Add sidebar entry visible only to Admin and Superadmin.
- Implement Users module with:
	- List table
	- Filters/search
	- Create user dialog
	- Edit user dialog
	- Deactivate/reactivate action
	- Reset password action
	- Superadmin-only role permission matrix
- Wire module to React Query hooks and typed services.
- Invalidate users, roles, permissions, and current auth profile where relevant after mutations.

## Security and Best Practices
- Never trust frontend-only permission checks.
- Prevent self-deactivation and self-role-demotion.
- Prevent Admin from editing Admin or Superadmin users.
- Prevent Admin from granting permissions outside staff scope.
- Require confirmation for deactivation, role change, and permission matrix changes.
- Avoid exposing password hashes, PIN hashes, or sensitive auth internals in API responses.
- Prefer temporary password reset flow only if email/invite flow is not available yet.

## Test Plan

### Backend Unit Tests
- Superadmin can create admin and staff.
- Admin can create staff.
- Admin cannot create admin.
- Admin cannot edit Superadmin.
- Staff cannot access user-management endpoints.
- Self-deactivation is rejected.
- Role permission updates are Superadmin-only.
- JWT claims include correct role and permissions.

### Backend API Tests
- User list filters by search, role, active status.
- Create user validates duplicate email.
- Deactivate user prevents login.
- Reset password works only within caller scope.
- Role permission matrix updates persist correctly.

### Frontend Unit Tests
- `usePermissions` resolves role and permission checks correctly.
- Sidebar hides Users for Staff.
- Admin UI hides Superadmin-only permission matrix.
- Action buttons disable or hide based on permissions.

### Frontend Integration Tests
- Admin can list, create, edit, deactivate staff.
- Admin cannot see admin-management controls.
- Superadmin can manage admins and staff.
- Superadmin can update role preset permissions.
- Blocked users are redirected to `/unauthorized`.

### E2E Tests
- Staff cannot navigate directly to `/app/admin/users`.
- Admin completes staff lifecycle.
- Superadmin changes staff role permissions and sees updated UI behavior.
- Deactivated user cannot log in.

## Assumptions
- Admin scope is Staff only.
- v1 uses role presets with an editable permission matrix, not custom roles or per-user overrides.
- Backend remains Django REST Framework with SimpleJWT.
- Frontend remains React, React Router, React Query, and the current module-first structure.
- Existing role routes for Admin, Staff, and Superadmin stay in place.