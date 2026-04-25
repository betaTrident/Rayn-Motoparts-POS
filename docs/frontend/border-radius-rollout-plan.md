# Border Radius Rollout Plan
# Rayn Motoparts POS Web

Prepared: 2026-04-25
Scope: Standardize subtle border radius usage across all sections and pages while preserving the Industrial Atelier visual identity.

---

## 1. Objective

Apply a small, consistent radius system to improve perceived quality and readability of components, without making the UI look overly rounded.

Success criteria:

1. All page-level and module-level components follow one shared radius scale.
2. Radius usage is consistent between admin, staff, and system routes.
3. No component exceeds 8px radius unless it is intentionally circular (avatar, status dot, chip).

---

## 2. Radius Standard (Design Tokens)

Use this scale everywhere in the web app:

1. `radius-sm = 4px` (micro controls and tiny indicators)
2. `radius-md = 6px` (buttons, inputs, selects, tabs)
3. `radius-lg = 8px` (cards, panels, module section blocks)
4. `radius-xl = 12px` (dialogs, drawers, popovers)

Guardrails:

1. No decorative pill radius for enterprise containers.
2. Do not mix multiple radius values inside one component family unless there is clear hierarchy.
3. Circular forms (`rounded-full`) are only allowed for semantic circles.

---

## 3. Component Mapping

## 3.1 Core UI Primitives

1. Buttons: 6px
2. Inputs/Textareas/Selects/Combobox: 6px
3. Toggle, checkbox surface, menu item hit areas: 4px
4. Cards and inline data panels: 8px
5. Dialog/Popover/Drawer containers: 12px
6. Table wrappers and data section shells: 8px
7. Table rows: 0px by default, 6px only for selected/expanded grouped row treatment

## 3.2 Layout Components

1. Header quick-action buttons: 6px
2. Sidebar item containers: 6px
3. Page shell and section panels: 8px
4. Floating utility shells and command surfaces: 12px

---

## 4. Page and Section Coverage Matrix

Apply this to all routes and role groups.

## 4.1 Admin Routes

1. `/app/admin/dashboard`: KPI cards 8px, filters/buttons 6px, modal surfaces 12px
2. `/app/admin/catalog`: grid cards 8px, toolbar controls 6px, dialogs 12px
3. `/app/admin/inventory`: stock cards 8px, form controls 6px, popovers 12px
4. `/app/admin/pos`: product/cart cards 8px, action controls 6px, checkout dialog 12px
5. `/app/admin/transactions`: table shell 8px, filters 6px, detail dialog 12px
6. `/app/admin/returns`: summary blocks 8px, form controls 6px, confirmation dialogs 12px
7. `/app/admin/customers`: profile/list cards 8px, search/actions 6px, dialogs 12px
8. `/app/admin/reports`: chart containers 8px, filter controls 6px, export popovers 12px
9. `/app/admin/settings`: settings groups 8px, toggles and inputs 6px, drawer/dialog 12px

## 4.2 Staff Routes

1. `/app/staff/dashboard`: same standards as admin dashboard
2. `/app/staff/pos`: same standards as admin POS
3. `/app/staff/transactions`: same standards as admin transactions
4. `/app/staff/returns`: same standards as admin returns
5. `/app/staff/customers`: same standards as admin customers
6. `/app/staff/inventory` (if enabled): same standards as admin inventory

## 4.3 System Routes (Superadmin)

1. `/app/system/health`: diagnostic cards 8px, action controls 6px, overlays 12px
2. `/app/system/rollout`: rollout blocks 8px, toggles/actions 6px, confirms 12px
3. `/app/system/reconciliation`: panel cards 8px, filters 6px, modal steps 12px
4. `/app/system/audit`: table shell 8px, filter controls 6px, detail dialogs 12px
5. `/app/system/cutover-controls`: warning/flag panels 8px, actions 6px, safety dialogs 12px

---

## 5. Technical Implementation Plan

## Phase 1: Token Baseline (Global)

1. Confirm root tokens in `apps/web/src/index.css`:
- `--radius-sm: 4px`
- `--radius-md: 6px`
- `--radius-lg: 8px`
- `--radius-xl: 12px`
2. Ensure all utility and component classes map to these values.
3. Keep a hard cap at 12px for non-circular components.

Exit criteria:

1. Global radius variables exist and are documented.
2. Shared UI primitives consume radius tokens rather than hard-coded ad hoc values.

## Phase 2: Shared UI Primitive Alignment

1. Review `components/ui/*` for out-of-standard classes (`rounded-xl`, large rounding where not needed).
2. Normalize to 6px/8px/12px by component role.
3. Preserve intentional `rounded-full` cases only (avatar, status indicators, progress markers).

Exit criteria:

1. Shared primitives produce consistent shape language.
2. No accidental over-rounding remains in common components.

## Phase 3: Module-by-Module Sweep

1. Update module pages under `components/modules/*` and route page wrappers under `app/*/*/page.tsx`.
2. Apply the coverage matrix section-by-section.
3. Validate visual consistency between admin and staff module variants.

Exit criteria:

1. All module surfaces follow the same radius hierarchy.
2. Role variants match shape behavior.

## Phase 4: QA and Enforcement

1. Add visual QA checklist for every module PR.
2. Add code review rule: no radius above 12px unless semantically circular.
3. Run responsive checks on desktop and mobile for clipping and overflow regressions.

Exit criteria:

1. Radius system remains stable through future feature delivery.
2. Visual regressions are caught during review.

---

## 6. QA Checklist (Per Page)

1. Are buttons and inputs consistently 6px?
2. Are cards and section blocks consistently 8px?
3. Are dialogs/drawers/popovers consistently 12px?
4. Are table rows flat unless there is a justified grouped-row treatment?
5. Are full-circle shapes only used for semantic circles?
6. Does mobile layout keep corners clean with no clipping artifacts?

---

## 7. Ownership and Rollout Sequence

Suggested implementation order:

1. Shared `components/ui` primitives
2. Layout shell (`components/layout`)
3. Admin modules (dashboard -> catalog -> inventory -> pos -> transactions -> returns -> customers -> reports -> settings)
4. Staff modules
5. System modules

Definition of done:

1. All pages in the route map comply with this radius standard.
2. Reviewers sign off using the QA checklist.
3. No UI component family has mixed or inconsistent rounding.
