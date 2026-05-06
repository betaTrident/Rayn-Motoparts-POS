---
name: backend-api
description: "Build or update Django REST Framework endpoints, serializers, permissions, and tests. Use when: API endpoints, RBAC changes, or JWT claims."
argument-hint: "Endpoint or resource"
---
# Backend API Workflow

## When to Use
- New or updated DRF endpoints
- Changes to RBAC or permissions
- JWT claim adjustments or auth flows

## Procedure
1. Confirm route, inputs, outputs, and permission scope.
2. Locate existing models and serializers to reuse.
3. Implement or update serializer and validation.
4. Implement view or viewset and route wiring.
5. Add permission checks and scope validation.
6. Add or update tests for success and failure cases.

## Output Format
- API summary (route, method, permissions)
- Files changed
- Tests added or suggested
- Follow-up items
