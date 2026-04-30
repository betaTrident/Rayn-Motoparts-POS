# Inventory Module Refactor — Strategic Implementation Plan

> **Version:** 1.0 | **Status:** Planning  
> **Scope:** Full-stack — Django REST backend + React/Tailwind frontend  
> **Design System:** Industrial Atelier (Racing Orange `#ff5722`)

---

## 1. Objective & Context

The current `InventoryModulePage` is a dashboard-style card layout that is **read-only**, **data-scarce**, and **disconnected from the actual `InventoryStock` / `StockMovement` database** (it re-uses the POS dashboard snapshot instead of a dedicated inventory API). The goal is to transform it into a **fully functional, data-rich Inventory Control Center** with:

- **KPI Stats Strip** — real-time health at a glance  
- **Tabbed DataTable** — unified, scannable stock data with filtering/sorting/pagination  
- **Stock Adjustment Flow** — operators can add or subtract stock in-app (no admin panel needed)  
- **Stock Movement Audit Log** — full perpetual ledger visible to authorized users  
- **Reorder Configuration** — set thresholds per-variant without leaving the page  

---

## 2. Data Architecture (Review)

The backend already has 3 perfectly scoped models in `inventory/models.py`:

| Table | Purpose | Key Fields |
|---|---|---|
| `InventoryStock` | **Current State** — one row per `ProductVariant` | `qty_on_hand`, `qty_reserved`, `qty_available` (computed), `reorder_point`, `reorder_qty`, `avg_cost` |
| `StockMovement` | **Ledger** — immutable audit trail of every qty change | `movement_type`, `qty_before`, `qty_change`, `qty_after`, `reference_type`, `reference_id`, `performed_by` |
| `StockAdjustment` | **Intent Record** — links a human decision to a movement | `adjustment_type` (add/subtract), `quantity`, `reason`, `notes`, `performed_by` |

> [!IMPORTANT]
> There is **no dedicated `inventory` app in `config/urls.py`** yet. New API endpoints must be added to a new `inventory/urls.py` and registered.

---

## 3. Backend Implementation Plan

### Phase 3A — Create `inventory/views.py`

**Endpoint 1: `GET /api/inventory/stock/`** — Stock Level List  
Paginated, filterable list of all `InventoryStock` rows with denormalized product info.  
Query params: `?search=`, `?status=low_stock|out_of_stock|in_stock`, `?category=`

**Endpoint 2: `GET /api/inventory/stock/summary/`** — KPI Stats  
Fast aggregation: `total_variants_tracked`, `in_stock_count`, `low_stock_count`, `out_of_stock_count`, `total_stock_value`.

**Endpoint 3: `POST /api/inventory/adjust/`** — Stock Adjustment  
Accepts: `variant_id`, `adjustment_type`, `quantity`, `reason`, `notes`. Atomically creates `StockAdjustment` + `StockMovement`.

**Endpoint 4: `GET /api/inventory/movements/`** — Movement Log  
Paginated `StockMovement` records. Query params: `?variant_sku=`, `?movement_type=`, `?date_from=`, `?date_to=`

**Endpoint 5: `PATCH /api/inventory/stock/<id>/configure/`** — Update Thresholds  
Accepts: `reorder_point`, `reorder_qty`, `max_stock_level`.

### Phase 3B — `inventory/urls.py` (new file)

```python
from django.urls import path
from . import views

urlpatterns = [
    path('stock/',                    views.InventoryStockListView.as_view()),
    path('stock/summary/',            views.InventoryStockSummaryView.as_view()),
    path('stock/<int:pk>/configure/', views.StockConfigureView.as_view()),
    path('movements/',                views.StockMovementListView.as_view()),
    path('adjust/',                   views.StockAdjustView.as_view()),
]
```

### Phase 3C — Register in `config/urls.py`

```python
path('api/inventory/', include('inventory.urls')),
```

---

## 4. Frontend Architecture Plan

### 4A — File Structure

```
src/
  components/modules/inventory/
    InventoryModulePage.tsx        ← Main page (refactored)
    parts/
      InventoryStatsStrip.tsx      ← 5-card KPI row
      InventoryStockTable.tsx      ← Tab 1: Stock Levels DataTable
      StockMovementTable.tsx       ← Tab 2: Movement Audit Log DataTable
      StockAdjustSheet.tsx         ← Slide-out sheet for +/- stock
      StockConfigureSheet.tsx      ← Slide-out sheet for reorder settings

  hooks/modules/
    useInventory.ts                ← React Query hooks for all 5 endpoints

  services/modules/
    inventory.service.ts           ← API fetch functions + TypeScript types
```

### 4B — Page Layout Wireframe

```
┌─────────────────────────────────────────────────────────────────┐
│  PageHeader — "Inventory Control"      [+ Adjust Stock] button  │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────┐ │
│  │ Tracked  │ │ In Stock │ │Low Stock │ │Out Stock │ │ Total│ │
│  │ Variants │ │   98     │ │   15 ⚠  │ │   7 ❌  │ │ Value│ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────┘ │
├─────────────────────────────────────────────────────────────────┤
│  [ Stock Levels ] [ Stock Movements ]                           │
│ ┌───────────────────────────────────────────────────────────────┐
│ │  Search: [___________] Status: [All ▾] Category: [All ▾]     │
│ ├──────┬──────────────────┬──────┬──────┬──────┬───────┬───────┤
│ │ SKU  │ Product          │ On  │ Avail│ Reord│Status │Actions│
│ └──────┴──────────────────┴──────┴──────┴──────┴───────┴───────┘
└─────────────────────────────────────────────────────────────────┘
```

### 4C — Tab 1: Stock Levels DataTable Columns

| Column | Source Field | Notes |
|---|---|---|
| Variant SKU | `variant_sku` | Monospace font, searchable |
| Product Name | `product_name` | Truncated, searchable |
| Category | `category` | Badge |
| On Hand | `qty_on_hand` | Right-aligned |
| Reserved | `qty_reserved` | Right-aligned, muted |
| **Available** | `qty_available` | **Bold**, right-aligned |
| Reorder At | `reorder_point` | Right-aligned |
| Status | `status` | Colored badge: green/amber/red |
| Avg Cost | `avg_cost` | Currency, right-aligned |
| Actions | — | `[Configure ⚙]` + `[Adjust 📦]` icon buttons |

### 4D — Tab 2: Stock Movements DataTable Columns

| Column | Source Field | Notes |
|---|---|---|
| Timestamp | `created_at` | Date + time, sorted descending |
| Variant SKU | `variant_sku` | Monospace |
| Product | `product_name` | Truncated |
| Movement | `movement_type` | Badge: ↑ green / ↓ red / ⚙ orange / ↩ blue |
| Reference | `reference_type` + `reference_id` | e.g., "Transaction #204" |
| Before | `qty_before` | Right-aligned, muted |
| **Change** | `qty_change` | **Bold**, green (+) or red (−) |
| After | `qty_after` | Right-aligned |
| Performed By | `performed_by` | User full name |

### 4E — Stock Adjustment Sheet

Slide-out `<Sheet>` with: Product Variant selector, Add/Remove toggle, Quantity input, Reason dropdown (presets), Notes textarea.

### 4F — Stock Configure Sheet

Slide-out `<Sheet>` with: Reorder Point, Reorder Quantity, Max Stock Level (optional).

---

## 5. TypeScript Types

```typescript
export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export interface InventoryStockRow {
  id: number;
  variant_sku: string;
  product_name: string;
  category: string;
  qty_on_hand: number;
  qty_reserved: number;
  qty_available: number;
  reorder_point: number;
  reorder_qty: number;
  avg_cost: number;
  status: StockStatus;
  last_counted_at: string | null;
}

export interface InventoryStockSummary {
  total_variants_tracked: number;
  in_stock_count: number;
  low_stock_count: number;
  out_of_stock_count: number;
  total_stock_value: number;
}

export interface StockMovementRow {
  id: number;
  variant_sku: string;
  product_name: string;
  movement_type: string;
  reference_type: string;
  reference_id: number;
  qty_before: number;
  qty_change: number;
  qty_after: number;
  performed_by: string;
  created_at: string;
}

export interface StockAdjustPayload {
  variant_id: number;
  adjustment_type: 'add' | 'subtract';
  quantity: number;
  reason: string;
  notes?: string;
}
```

---

## 6. React Query Hooks

```typescript
useInventorySummary()                    // KPI stats strip
useInventoryStock(params)                // Tab 1: paginated stock list
useStockMovements(params)               // Tab 2: paginated movement log
useStockAdjust()                         // Mutation: POST /adjust/
useStockConfigure(id)                    // Mutation: PATCH /stock/<id>/configure/
```

---

## 7. Implementation Phases

| # | Phase | Backend | Frontend |
|---|---|---|---|
| 1 | API Foundation | `inventory/views.py`, `urls.py`, register route | — |
| 2 | Service Layer | — | `inventory.service.ts`, `useInventory.ts` |
| 3 | Stats Strip | — | `InventoryStatsStrip.tsx` |
| 4 | Stock Levels Tab | — | `InventoryStockTable.tsx` |
| 5 | Movements Tab | — | `StockMovementTable.tsx` |
| 6 | Adjust Flow | — | `StockAdjustSheet.tsx` + mutation |
| 7 | Configure Flow | — | `StockConfigureSheet.tsx` + mutation |
| 8 | Page Assembly | — | Refactor `InventoryModulePage.tsx` |

---

## 8. Design & UX Guidelines

- **Status Badges**: `IN_STOCK` → green, `LOW_STOCK` → amber with ⚠, `OUT_OF_STOCK` → red with ✕.
- **Movement badges** use directional icons for at-a-glance intent.
- **Row actions** are icon-only buttons to minimize horizontal space.
- **Sheets over Modals** to keep table context visible.
- **Orange section headers** inside sheets: `bg-[#ff5722] text-white`.
- **No optimistic UI** for stock quantities — wait for server confirmation.
- **Toast on success** via `sonner` for adjustments and configure saves.
- **Page sizes**: 25 for stock levels; 50 for movements.

---

## 9. RBAC Gating

| Permission | Roles | Gates |
|---|---|---|
| `inventory.read` | staff, admin, superadmin | Page access |
| `inventory.adjust` | staff, admin, superadmin | Adjust + Configure action buttons |

---

## 10. Open Questions

> [!NOTE]
> Resolve before Phase 6.

1. **Reason presets** — hardcoded or backend-managed list?
2. **Movement pagination** — 50 per page or cursor-based infinite scroll?
3. **Negative stock guard** — backend must return a user-readable `400`; frontend surfaces it as a form-level error, not a generic toast.
4. **Warehouse field** — the migration shows a `warehouse` FK but current `models.py` does not include it. Confirm if multi-warehouse is deferred.
