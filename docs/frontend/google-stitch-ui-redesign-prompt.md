# Rayn Motoparts POS Web Feature Scope + Google Stitch UI Redesign Prompt

Prepared: 2026-04-04

## 1) Web Features To Implement (Product Scope)

Use this as the functional source of truth for the web redesign.

### A. Role Model and Access

Roles:
- superadmin (developer-level operations + full admin workflows)
- admin (owner/business operator)
- staff (cashier/mechanic operational role)

Access behavior:
- superadmin and admin land on admin dashboard after login.
- staff lands on staff dashboard after login.
- unauthorized routes show a single Unauthorized experience.
- route protection layers: AuthGuard, RoleGuard, PermissionGuard.

### B. Route Groups and Information Architecture

Route groups:
- /app/admin/*
- /app/staff/*
- /app/system/* (superadmin only)

Admin modules:
- dashboard
- catalog
- inventory
- pos
- transactions
- returns
- customers
- reports
- settings

Staff modules:
- dashboard (staff-focused)
- pos
- transactions
- returns
- customers (lookup + minimal write)

Superadmin extra modules:
- system-health
- rollout-control
- reconciliation
- audit
- developer-tools (optional/read-only diagnostics)

### C. Core Functional Requirements by Module

Dashboard:
- role-aware KPI cards
- analytics section with timeframe filters (today, 7d, 30d, custom)
- sales analytics visuals (revenue trend, transaction volume, average ticket)
- top products/categories and low-stock insight cards
- sales trends and quick operational status
- short-refresh data behavior

Catalog:
- product table, category management, product form
- typed payloads aligned to backend serializers

Inventory:
- stock visibility, movement context, adjustments flow
- no frontend stock math for authoritative calculations

POS:
- fast product find/barcode workflow
- cart and checkout flow optimized for speed

Transactions:
- list + detail view
- server pagination support (page, page_size, pagination object)
- filterable history with consistent query params

Returns:
- return creation flow
- return item table + validation states

Customers:
- quick lookup and profile summary
- optimized for POS and transaction linkage

Reports:
- filter-driven summary and trend visuals
- business-readable exports/view modes

Settings:
- business settings management (admin/superadmin)

System (superadmin):
- health diagnostics
- rollout flag read/update with safe confirmation workflow
- reconciliation trigger/status and run output visibility
- filterable audit explorer

### D. Data and UX Rules

- Keep API access in service layer only (no direct API calls in presentational components).
- Keep page entries as orchestration only; business UI belongs in module components.
- Consistent loading/error/empty/success states across modules.
- Use role-aware visibility and action gating.
- Do not include discount workflows in UI scope.
- Assume single-store operation defaulting to MAIN warehouse context.

### E. Delivery Priorities (Suggested)

1. Routing foundation (role groups + guards + post-login redirects)
2. Dashboard
3. Transactions
4. Catalog
5. Inventory
6. POS
7. Returns
8. Customers
9. Reports
10. Settings
11. Superadmin system modules

---

## 2) Copy/Paste Prompt For Google Stitch

Use the prompt below exactly, then iterate with Stitch using screenshots from current UI.

```text
Redesign the Rayn Motoparts POS web application UI.

Goal:
Create a professional, clean, modern, uniform, consistent and high-clarity interface for a role-based business system used daily by motorparts operations teams.

Product Context:
- Business: Rayn Motoparts POS-IMS
- Users: superadmin, admin (owner), staff (cashier/mechanic)
- Device focus: desktop-first web app for store operations, with responsive tablet behavior
- Tone: practical, trustworthy, fast, business-grade, professional

Mandatory UX Direction:
1) Visual style
- Clean, modern, minimal-but-not-empty
- Strong information hierarchy and whitespace rhythm
- Crisp typography and structured spacing
- Neutral base palette with one confident accent color for primary actions
- Subtle depth (cards, separators, elevation) but avoid heavy skeuomorphism
- Avoid playful/gimmicky visuals

2) Layout and navigation
- Left sidebar navigation + top utility bar pattern
- Clear grouping by role and module
- Predictable page templates for list/detail/form/dashboard screens
- Breadcrumb + page title + contextual actions in header region

3) Role-based IA to reflect
- Admin modules: dashboard, catalog, inventory, pos, transactions, returns, customers, reports, settings
- Staff modules: dashboard, pos, transactions, returns, customers
- Superadmin extras under a dedicated “System” nav group: health, rollout-control, reconciliation, audit

4) Critical workflow screens to design
- Dashboard (admin + staff variants)
- Dashboard analytics section with:
	- KPI strip (gross sales, net sales, transaction count, average basket size)
	- trend charts by day/week/month
	- top-selling products and category contribution
	- hourly sales heatmap or peak-hours widget for operational planning
	- low-stock alert panel and quick action links
- POS checkout flow (fast item search/barcode/cart/payment)
- Transactions list + transaction detail drawer/page
- Inventory list + stock adjustment interaction
- Returns creation flow
- Catalog product table + product form
- Reports filter + chart summary page
- System reconciliation + rollout-control pages (superadmin)

5) Data-heavy UI standards
- Design dense but readable data tables (sticky header, row hover clarity, status chips)
- Include robust states: loading, empty, error, success, partial data
- Add search/filter/sort patterns that are obvious and ergonomic
- Pagination components should support server-paginated lists

6) Component behavior expectations
- Reusable cards, tables, forms, modals, drawers, tabs, badges, alerts
- Form UX: clear labels, helper text, validation, error recovery
- Confirmation modals for destructive/system-impacting actions
- Toast/inline feedback patterns after mutations

7) Operational constraints to respect in wording and UI
- No discount features or discount fields anywhere
- Single-store default context (MAIN warehouse)
- Role-based visibility and permission boundaries must be obvious in navigation and actions

8) Deliverables requested from Stitch
- Full design direction (color tokens, type scale, spacing, radius, elevation)
- Key page mockups for each critical module listed
- Reusable component set and interaction rules
- Responsive behavior notes for desktop/tablet
- Accessibility-conscious contrast and focus states

Design adjectives:
Professional, clean, modern, efficient, structured, trustworthy, operationally fast.

Output quality bar:
This must look like a production-ready B2B SaaS interface, not a generic template.
```

## 3) Optional Follow-Up Prompt (After First Stitch Output)

```text
Refine the concept into Version 2 with stronger visual hierarchy for high-volume daily use.

Focus updates:
- Increase scanability of tables and KPIs
- Improve action prominence for POS and inventory adjustments
- Tighten spacing consistency and alignment grid
- Make role context clearer (admin/staff/superadmin)
- Add more explicit empty/error states

Keep the same overall design language, but make it more implementation-ready for React component mapping.
```