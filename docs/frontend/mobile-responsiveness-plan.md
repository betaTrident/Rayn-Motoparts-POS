# 📱 Mobile Responsiveness Strategic Plan
## Rayn Motoparts POS — Industrial Atelier Design System

> **Objective:** Make every page and component fully responsive on all screen sizes (320px → 2560px) without altering the Industrial Atelier visual identity.
>
> **Design Rule:** Mobile-first adjustments. Never break desktop layouts — only *extend* them downward.

---

## 0. Guiding Principles

| Principle | Detail |
|---|---|
| **Mobile-first** | Write base styles for small screens, use `sm:`, `md:`, `lg:`, `xl:` to unlock wider layouts |
| **Design-safe** | Never change colors, typography weights, or the `ia-*` token set |
| **Touch-friendly** | All interactive targets ≥ 44 × 44 px on mobile |
| **No layout destruction** | Desktop experience stays identical — we only add responsive overrides |
| **Stack before side-by-side** | Multi-column sections collapse to single column on small screens |
| **Progressive disclosure** | Hide secondary info on tiny screens, reveal on larger ones |

---

## 1. Breakpoint Reference

Using Tailwind's built-in breakpoint scale (already configured via `tailwindcss`):

| Prefix | Min-width | Typical device |
|---|---|---|
| *(base)* | 320px | Small phones |
| `sm:` | 640px | Large phones / small tablets |
| `md:` | 768px | Tablets portrait |
| `lg:` | 1024px | Tablets landscape / small laptops |
| `xl:` | 1280px | Desktops |
| `2xl:` | 1536px | Large desktops |

---

## 2. Phase 1 — App Shell (Critical Path)

> **Files:** `MainLayout.tsx`, `AppSidebar.tsx`, `AppHeader.tsx`
>
> **Priority: 🔴 Highest** — Every page depends on this layer.

### 2.1 `AppSidebar.tsx` → Mobile Drawer

**Current problem:** The sidebar is `fixed left-0` with `w-64` or `w-16`. On mobile it permanently occupies space and obscures the page content.

**Solution: Overlay drawer on mobile, fixed rail on desktop**

```
Mobile (< lg):  Sidebar hidden off-screen → slides in as full-width overlay drawer
                A backdrop overlay covers the page content beneath it
                Closes on backdrop click or nav item click

lg+:            Current behavior unchanged (fixed rail, collapsible to 64px icon-only)
```

**Implementation steps:**

1. **Add mobile open state** — lift `mobileOpen: boolean` state into `AppSidebar` (or use a shared context). Expose a `toggleMobileSidebar()` function.
2. **Conditional positioning:**
   ```tsx
   // Replace the single `fixed left-0 top-0 h-screen` aside with:
   className={cn(
     "fixed top-0 h-screen flex flex-col bg-white z-50",
     "border-r border-[rgba(84,96,103,0.22)] transition-all duration-200 ease-in-out",
     // Mobile: slide from left, hidden by default
     "left-0",
     // Mobile state
     mobileOpen ? "translate-x-0" : "-translate-x-full",
     // lg+: always visible, same collapse behaviour as today
     "lg:translate-x-0",
     // Width
     collapsed ? "lg:w-16 w-72" : "w-72 lg:w-64",
   )}
   ```
3. **Backdrop overlay** — Render a `<div>` with `fixed inset-0 bg-black/40 z-40 lg:hidden` when `mobileOpen` is true. Clicking it closes the drawer.
4. **Close on navigation** — call `setMobileOpen(false)` inside each `NavItem` `onClick` handler on mobile.
5. **Pass `toggleMobileSidebar` up** to `MainLayout` so `AppHeader` can call it.

---

### 2.2 `AppHeader.tsx` → Hamburger on Mobile

**Current problem:** The header is `fixed top-0` with `left-{sidebarWidth}`. On mobile the sidebar is hidden, so the header should span full width and show a hamburger menu.

**Solution:**

1. **Full-width on mobile:**
   ```tsx
   // Replace leftOffset logic with:
   "left-0 lg:left-16"   // collapsed
   "left-0 lg:left-64"   // expanded
   ```
2. **Add hamburger button** — visible only on mobile (`lg:hidden`):
   ```tsx
   <button
     onClick={onToggleMobileSidebar}
     className="lg:hidden w-10 h-10 flex items-center justify-center text-[#546067] hover:text-[#ff5722] rounded-sm"
     aria-label="Open navigation"
   >
     <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>menu</span>
   </button>
   ```
3. **Collapse search bar on very small screens** — on `< sm`, hide the text search input and show only a search icon button that expands to full width on tap.
   ```tsx
   // Search: hidden on xs, visible on sm+
   <div className="hidden sm:flex relative flex-1 max-w-md"> ... </div>
   // Icon fallback on xs
   <button className="sm:hidden ..."><span>search</span></button>
   ```

---

### 2.3 `MainLayout.tsx` → Responsive Content Offset

**Current problem:** Content offset (`ml-64` / `ml-16`) is always applied, even on mobile where the sidebar is hidden.

**Solution:**
```tsx
// Replace:
const contentOffset = collapsed ? "ml-16" : "ml-64";

// With:
// No margin on mobile (sidebar is a drawer overlay)
// Apply margin only on lg+
const contentOffset = collapsed
  ? "lg:ml-16"
  : "lg:ml-64";
```

Also tighten the page canvas padding on mobile:
```tsx
// Replace: <div className="p-6">
// With:
<div className="p-4 sm:p-6">
```

> [!IMPORTANT]
> Phase 1 must be completed **first** before any page-level work. All pages inherit from the shell.

---

## 3. Phase 2 — Dashboard Page

> **Files:** `DashboardModulePage.tsx`, `DashboardHeaderControls.tsx`, `KpiSummaryCards.tsx`, `SalesPerformanceSection.tsx`, `OperationalInsightsSection.tsx`, `RecentTransactionsTable.tsx`, `StaffOperationsPanel.tsx`

### 3.1 `DashboardHeaderControls.tsx` — Range Controls Wrap

**Problem:** The range pill tabs + custom date inputs + Export button all sit in one `flex` row. On mobile this overflows.

**Fix:**
```tsx
// Range pills: allow horizontal scroll on xs
<div className="flex border border-[rgba(84,96,103,0.3)] rounded-md overflow-hidden overflow-x-auto">

// Custom date inputs: stack on xs, row on sm+
<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">

// Export button: full-width on mobile
<button className="w-full sm:w-auto px-4 py-2 ...">
```

### 3.2 `KpiSummaryCards.tsx` — Already Responsive ✅

Grid is `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`. **No changes needed.**

### 3.3 `SalesPerformanceSection.tsx` — Charts Reflow

**Problem:** Charts use `lg:grid-cols-7` split. On mobile both cards stack fine, but chart heights are fixed (`h-64`, `h-48`, `h-56`) which may be too short for narrow viewports with wide data.

**Fix:**
```tsx
// Revenue Velocity chart: reduce height on mobile
className="h-52 sm:h-64 w-full"

// Chart margins on mobile: reduce left margin to avoid clipping
margin={{ top: 5, right: 5, left: -10, bottom: 0 }}
```

### 3.4 `OperationalInsightsSection.tsx` — Alert Grids

**Problem:** `md:grid-cols-2` is fine, but cashier name and stats may overflow on mobile.

**Fix:**
```tsx
// Cashier name — truncate properly
<p className="text-xs font-bold text-[#1a1c1c] truncate max-w-[120px] sm:max-w-none">

// Cashier stats — wrap label on xs
<p className="text-[10px] text-[#546067] font-medium">
  {cashier.orders} orders
  <span className="hidden sm:inline"> · AOV {formatCurrency(cashier.avgOrderValue)}</span>
</p>
```

### 3.5 `RecentTransactionsTable.tsx` — Horizontal Scroll

**Problem:** Tables with many columns overflow on mobile.

**Fix:** Wrap table in a horizontally scrollable container:
```tsx
<div className="overflow-x-auto -mx-5 px-5">
  <table className="w-full min-w-[600px]"> ... </table>
</div>
```
Hide lower-priority columns on mobile with `hidden sm:table-cell` on `<th>` and `<td>`.

---

## 4. Phase 3 — Point of Sale (POS) Page

> **File:** `PosModulePage.tsx`
>
> **Status:** Has a mobile bottom bar (`xl:hidden`) ✅ — but the split-panel layout needs refinement.

### 4.1 Product Browser + Cart Split

**Problem:** The `xl:grid-cols-[...]` grid means both panels are stacked on everything below `xl`. The Cart panel is visible below the product grid, which on mobile means a lot of scrolling.

**Strategy — Tab-based layout on mobile:**

```
Mobile (< lg):
  - Show a tab bar: [Products] [Cart (3)]
  - Toggle between views
  - Keep the existing fixed bottom bar for quick checkout

lg–xl:
  - Both panels visible but stacked (Products above, Cart below)

xl+:
  - Current side-by-side layout ✅
```

**Implementation:**
1. Add local state: `const [mobileTab, setMobileTab] = useState<'products'|'cart'>('products')`
2. Render a tab switcher bar visible only on `lg:hidden`
3. Use conditional rendering:
   ```tsx
   <div className={cn("...", mobileTab === 'products' ? 'block' : 'hidden', 'lg:block')}>
     {/* Product browser */}
   </div>
   <div className={cn("...", mobileTab === 'cart' ? 'block' : 'hidden', 'lg:block')}>
     {/* Cart */}
   </div>
   ```
4. The existing bottom sticky bar already handles quick-glance cart summary ✅

### 4.2 Product Cards Grid

```tsx
// Tighten to single column on xs, 2 col on sm
className="grid gap-3 grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3"
```

### 4.3 Cart Item Row

The `sm:flex-row` on qty + price row already handles wrapping ✅.

---

## 5. Phase 4 — Catalog (Products) Page

> **File:** `CatalogModulePage.tsx`, `CatalogProductsTable.tsx`, `CatalogProductsToolbar.tsx`, `CatalogCategoriesPanel.tsx`

### 5.1 Toolbar

**Problem:** Filter controls (search, category, stock toggle) likely sit in one row and may overflow.

**Fix:**
```tsx
// Toolbar: flex-wrap, stack on xs
<div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
  <Input className="w-full sm:max-w-xs" ... />
  <Select className="w-full sm:w-48" ... />
</div>
```

### 5.2 Products Table

**Problem:** `<table>` with SKU, Category, Price, Stock, Status, Actions columns will overflow at mobile widths.

**Fix — Horizontal scroll wrapper:**
```tsx
<div className="overflow-x-auto rounded-lg border border-[rgba(84,96,103,0.2)]">
  <table className="w-full min-w-[700px]"> ... </table>
</div>
```

**Column hiding strategy:**
```tsx
// On <th> and corresponding <td>:
<th className="hidden md:table-cell">SKU</th>
<th className="hidden sm:table-cell">Category</th>
<th className="hidden md:table-cell">Stock</th>
// Always visible: Name · Price · Actions
```

### 5.3 Categories Side Panel

If the categories panel is a sidebar within the page, convert to a collapsible section on mobile:
```tsx
// Mobile: collapsed by default, toggle to expand
// lg+: always visible as side panel
```

### 5.4 Product Dialog / Form

**Problem:** Wide dialogs (e.g., `CatalogProductDialog.tsx`) overflow on mobile.

**Fix:**
```tsx
// Dialog container: full-height on mobile, modal on desktop
className="max-h-dvh overflow-y-auto sm:max-h-[85vh] sm:max-w-2xl"

// Inside dialog: single column form on xs, 2-col grid on sm+
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4"> ... </div>
```

---

## 6. Phase 5 — Transactions Page

> **File:** `TransactionsModulePage.tsx`

### 6.1 Filters Row

Stack date pickers and status filter vertically on mobile:
```tsx
<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
```

### 6.2 Transactions Table

Apply the same horizontal scroll + column hiding pattern:
```tsx
<div className="overflow-x-auto">
  <table className="min-w-[640px] w-full">
```

Priority columns on mobile: **Date · Amount · Status**
Hidden on mobile: **Transaction ID · Cashier · Payment Method**

---

## 7. Phase 6 — Inventory Page

> **File:** `InventoryModulePage.tsx` (and parts)

### 7.1 Stock Filter Bar

```tsx
<div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
```

### 7.2 Inventory Table

Horizontal scroll + column prioritization:
- Mobile columns: **Product · Available · Status**
- `sm:` add: Variant / SKU
- `md:` add: Reorder Point · Last Restocked

---

## 8. Phase 7 — Customers Page

> **File:** `CustomersModulePage.tsx` (and parts)

### 8.1 Customer Table

- Mobile: **Name · Total Spent · Actions**
- `sm:` add: Email
- `md:` add: Join Date · Order Count

### 8.2 Customer Detail Panel / Drawer

If a slide-out detail panel is used, ensure it takes full width on mobile:
```tsx
className="w-full sm:w-96"
```

---

## 9. Phase 8 — Reports Page

> **File:** `ReportsModulePage.tsx`

### 9.1 Report Charts

Apply same responsive chart height pattern:
```tsx
className="h-52 sm:h-64 w-full"
```

### 9.2 Export / Filter Controls

Stack vertically on mobile, row on `sm:`:
```tsx
<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
```

---

## 10. Phase 9 — Returns Page

> **File:** `ReturnsModulePage.tsx`

### 10.1 Returns Table

Apply horizontal scroll + priority columns:
- Mobile: **Date · Product · Reason · Status**
- `md:` add: Transaction ID · Processed By

---

## 11. Phase 10 — Settings Page

> **File:** `SettingsModulePage.tsx`

### 11.1 Settings Layout

If side-nav + content layout is used:
```
Mobile:    Tab bar at top (or accordion menu)
lg+:       Vertical side nav + main content column
```

### 11.2 Settings Forms

All form grids use single column on mobile:
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
```

---

## 12. Phase 11 — Login Page

> **File:** `LoginPage.tsx`
>
> **Status:** Already has mobile handling (`lg:hidden` logo, `hidden lg:flex` left panel) ✅

### Minor Fixes:
- Verify input fields have `font-size: 16px` minimum to prevent iOS auto-zoom:
  ```tsx
  // Add style={{ fontSize: "16px" }} to all inputs in LoginPage
  // or via global CSS (see Phase 12)
  ```

---

## 13. Phase 12 — System Pages

> **Files:** `SystemHealthPage.tsx`, `SystemRolloutPage.tsx`, `SystemAuditModulePage.tsx`, etc.

These are admin-only pages accessed from desktop. Apply:
- Horizontal scroll on any data tables
- Stack any stat cards to `grid-cols-1 sm:grid-cols-2`
- Ensure no fixed-width containers without `max-w-full`

---

## 14. Global CSS Additions

Add the following to `index.css` in the `@layer utilities` block:

```css
/* ── Mobile-safe input font size (prevents iOS zoom on focus) ── */
@media (max-width: 640px) {
  input, select, textarea {
    font-size: 16px !important;
  }
}

/* ── Touch-friendly minimum tap targets ── */
@media (max-width: 1024px) {
  button, a[role="button"], [role="tab"] {
    min-height: 44px;
    min-width: 44px;
  }
}

/* ── Horizontal table scroll utility ── */
.table-responsive {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
```

---

## 15. Implementation Checklist

### Phase 1 — Shell (Do First)
- [ ] `AppSidebar.tsx` — mobile drawer with backdrop overlay
- [ ] `AppHeader.tsx` — hamburger button, full-width on mobile, collapsible search
- [ ] `MainLayout.tsx` — remove hard margin on mobile, responsive `p-4 sm:p-6`

### Phase 2 — Dashboard
- [ ] `DashboardHeaderControls.tsx` — wrapping range pills, stacked date inputs
- [ ] `SalesPerformanceSection.tsx` — responsive chart heights, adjusted margins
- [ ] `OperationalInsightsSection.tsx` — cashier name truncation, stat wrapping
- [ ] `RecentTransactionsTable.tsx` — horizontal scroll + column hiding

### Phase 3 — POS
- [ ] `PosModulePage.tsx` — mobile tab layout (Products / Cart)
- [ ] Product card grid — `grid-cols-1 sm:grid-cols-2`

### Phase 4 — Catalog
- [ ] `CatalogProductsToolbar.tsx` — stacked filters
- [ ] `CatalogProductsTable.tsx` — horizontal scroll + column hiding
- [ ] `CatalogProductDialog.tsx` — full-screen on mobile
- [ ] `CatalogCategoriesPanel.tsx` — collapsible on mobile

### Phase 5 — Transactions
- [ ] Filters stacking
- [ ] Table scroll + column hiding

### Phase 6 — Inventory
- [ ] Filters stacking
- [ ] Table scroll + column hiding

### Phase 7 — Customers
- [ ] Table scroll + column hiding
- [ ] Detail panel full-width on mobile

### Phase 8 — Reports
- [ ] Chart height adjustments
- [ ] Filter control stacking

### Phase 9 — Returns
- [ ] Table scroll + column hiding

### Phase 10 — Settings
- [ ] Side nav → tabs on mobile

### Phase 11 — Login
- [ ] iOS zoom fix (16px font-size on inputs)

### Phase 12 — System Pages
- [ ] Table scroll
- [ ] Stat card grid responsiveness

### Global
- [ ] `index.css` — add mobile utility classes
- [ ] Verify all touch targets ≥ 44×44px
- [ ] Test at 320px, 375px, 414px, 768px, 1024px, 1280px

---

## 16. Testing Protocol

| Test | Tool | Breakpoints |
|---|---|---|
| Visual regression | Browser DevTools Device Toolbar | 320, 375, 390, 414, 768, 1024, 1280, 1440 |
| Touch targets | DevTools → Accessibility → Touch | All mobile widths |
| Overflow check | `document.querySelectorAll('*').forEach(el => { if(el.scrollWidth > el.clientWidth) console.log(el) })` | 320px |
| iOS zoom | Real iPhone or Safari emulation | 375px |
| Sidebar drawer | Manual tap/click | 375px, 768px |
| Table scroll | Manual swipe | 375px |

---

## 17. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Recharts on narrow screens may clip axes | Use `margin={{ left: -10 }}` or ensure `ChartContainer` is 100% width |
| shadcn/ui Dialog not full-screen on mobile | Add `max-h-dvh overflow-y-auto` to dialog content |
| Sidebar state shared between mobile/desktop | Use a single `useSidebarState` context hook or lift to `MainLayout` |
| POS tab layout increases click count | Sticky cart summary bar ensures users always see total |
| System pages rarely tested on mobile | Low risk — admin-only, but still apply scroll wrappers |

---

*Plan created: April 30, 2026 | System: Rayn Motoparts POS | Design System: Industrial Atelier*
