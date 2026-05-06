---
description: "Use when: Django REST Framework APIs, RBAC, auth, or backend work in apps/backend."
applyTo: "apps/backend/**"
---
# Backend Guidelines

- Follow DRF patterns: serializers, viewsets, permissions, routers.
- Enforce RBAC with Role, Permission, and RolePermission; never trust frontend checks.
- Keep scope rules explicit and testable (superadmin vs admin vs staff).
- Prefer soft deactivation and audit logs over hard deletes.
- Avoid exposing sensitive fields (passwords, tokens, internal flags).
- Keep responses lean and typed; add tests for new behavior.
