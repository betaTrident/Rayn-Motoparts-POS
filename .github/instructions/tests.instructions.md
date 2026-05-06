---
description: "Use when: writing or updating tests across backend and frontend."
applyTo:
  - "apps/**/tests/**"
  - "apps/**/tests.py"
  - "apps/**/__tests__/**"
  - "apps/**/*.test.*"
  - "apps/**/*.spec.*"
---
# Testing Guidelines

- Follow the existing test framework and fixtures in the area.
- Cover permissions, negative cases, and edge cases.
- Keep tests deterministic and isolated.
- Name tests after behavior and user role.
- Update or add tests when changing behavior.
