---
description: "Use when: Admin frontend work in apps/admin, including routes, modules, and UI state."
applyTo: "apps/admin/**"
---
# Frontend Guidelines (Admin)

- Keep the module-first structure: routes, components/modules, services/modules, hooks/modules.
- Use React Query and queryKeys for server data.
- Use RoleGuard for route protection and permission checks for action controls.
- Provide loading, empty, error, and saving states.
- Keep forms controlled and validate inputs consistently.
- Reuse existing UI primitives and patterns.
