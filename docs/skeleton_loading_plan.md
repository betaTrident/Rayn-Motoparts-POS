# 🦴 Skeleton Loading Implementation Plan

> **Objective:** Transition from generic loading spinners to high-fidelity Skeleton loading states across all dashboard modules to ensure a premium, stable, and "Industrial Atelier" user experience.

---

## 1. Why Skeleton Loading?
Unlike traditional spinners, skeletons provide:
- **Layout Stability:** Prevents "content jumping" by reserving the exact space data will occupy.
- **Perceived Speed:** Shows progress in a way that feels faster to the user.
- **Contextual Feedback:** Mimics the specific layout of the page (Table vs. Card vs. Stats).

---

## 2. Core Skeleton Architecture

We will implement a set of "Base Skeleton Shells" in `@/components/ui/skeletons/` that can be reused across all modules.

### A. Stats Strip Skeleton (`StatsSkeleton`)
Mimics the `UserStatsStrip` and `InventoryStatsStrip`.
- **Layout:** 5 columns of rounded-xl containers.
- **Detail:** Placeholder for an icon well and two lines of text (large value, small label).

### B. Data Table Skeleton (`TableSkeleton`)
Mimics the `DataTable` component.
- **Header:** Full-width light grey bar.
- **Toolbar:** Placeholders for search bar and action buttons.
- **Rows:** 5-10 rows of horizontal bars with variable widths to mimic different column data.

### C. Module-Specific Skeletons
For complex layouts like the **Role Access Matrix** (Accordion style) or **Product Catalog** (Grid of cards).

---

## 3. Implementation Pattern (Best Practices)

### 1. Step-by-Step State Handling
Instead of a single `isLoading` boolean, we use the granular states provided by **React Query**:

```tsx
const { data, isLoading, isError } = useGetProducts();

if (isLoading) return <CatalogSkeleton />;
if (isError) return <PageErrorState />;
if (!data?.length) return <PageEmptyState title="No Products" />;

return <CatalogProductsTable data={data} />;
```

### 2. Matching the "Industrial Atelier" Aesthetic
Our skeletons must match our design tokens:
- **Radius:** `rounded-xl` for cards, `rounded-md` for buttons/inputs.
- **Animation:** `animate-pulse` (default in our `Skeleton` component).
- **Colors:** Use `bg-muted/50` or `bg-accent` to keep the palette clean and monochromatic.

---

## 4. Phased Rollout Plan

### Phase 1: Shared Components
- [ ] Create `apps/web/src/components/ui/skeletons/` directory.
- [ ] Implement `StatsStripSkeleton.tsx`.
- [ ] Implement `DataTableSkeleton.tsx`.
- [ ] Implement `FormSkeleton.tsx` (for modals/dialogs).

### Phase 2: Core Dashboard Modules
- [ ] **Users Module:** Apply skeletons to the stats strip and user table.
- [ ] **Catalog Module:** Apply skeletons to the product grid/table.
- [ ] **Inventory Module:** Apply skeletons to the stock table and movement logs.

### Phase 3: Administrative Modules
- [ ] **Settings:** Skeleton for the profile and security tabs.
- [ ] **Transactions:** Skeleton for the transaction history list.
- [ ] **System Tools:** Skeletons for health metrics and audit logs.

---

## 5. Coding Standard for New Skeletons

Every new Skeleton component should follow this structure to ensure visual consistency:

```tsx
import { Skeleton } from "@/components/ui/skeleton";

export function TableSkeleton() {
  return (
    <div className="space-y-4">
      {/* Search/Toolbar row */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-[250px]" />
        <Skeleton className="h-10 w-[100px]" />
      </div>
      
      {/* Table rows */}
      <div className="rounded-md border border-border">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex h-16 items-center border-b px-6 gap-4">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-[150px]" />
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 6. Definition of Done
- [ ] Layout does not "shift" when transitioning from Loading → Data.
- [ ] Skeletons are visually indistinguishable from the actual components in terms of spacing/radius.
- [ ] All pages use specific skeletons instead of the generic `PageLoadingState` spinner.
- [ ] Accessibility: `aria-busy="true"` is applied to containers during loading.

---

*Last Updated: 2026-05-07*
