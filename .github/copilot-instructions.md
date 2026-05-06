# Copilot Instructions (Rayn Motoparts POS)

- Prefer existing patterns and the module-first frontend structure.
- Backend uses Django REST Framework and SimpleJWT; enforce RBAC server-side with Role, Permission, and RolePermission.
- Frontend uses React Query with queryKeys; use RoleGuard for routes and permission checks for actions.
- Avoid per-user overrides; use role presets and a permission matrix unless explicitly requested.
- Preserve auditability with soft deactivation and audit logs.
- Keep API responses lean and never expose sensitive auth fields.
- Update tests or document gaps when behavior changes.
