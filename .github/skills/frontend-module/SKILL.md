---
name: frontend-module
description: "Create or update a frontend module in apps/web using the module-first structure. Use when: new page, dialog, data table, or admin module."
argument-hint: "Module name and route"
---
# Frontend Module Workflow

## When to Use
- New module or page in apps/web
- Admin screens, dialogs, or data tables
- Route and sidebar updates

## Procedure
1. Confirm route, user roles, and data requirements.
2. Add or update the route entry.
3. Build module UI under components/modules.
4. Add services and React Query hooks.
5. Wire queryKeys and permission checks.
6. Add UI states (loading, empty, error, saving).

## Output Format
- Module summary (route, roles)
- Files changed
- Tests added or suggested
- Follow-up items
