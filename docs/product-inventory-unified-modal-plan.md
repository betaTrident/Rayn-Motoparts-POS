# 🔗 Unified Product + Inventory Modal — Strategic Implementation Plan

> **Authors:** @agency-backend-architect · @agency-senior-developer  
> **Status:** Ready for Implementation  
> **Target:** `CatalogProductDialog` → `UnifiedProductDialog`

---

## 1. Problem Statement

Currently, creating or editing a product requires navigating **three separate modals**:

| Action | Current Location |
|---|---|
| Create / Edit product details | `CatalogProductDialog.tsx` |
| Configure reorder thresholds | `StockConfigureSheet.tsx` (Inventory module) |
| Adjust stock count | `StockAdjustSheet.tsx` (Inventory module) |

This creates a disjointed, multi-step workflow where users must leave the Catalog, open Inventory, and operate multiple dialogs. The goal is to **consolidate all three into a single, tabbed, context-aware dialog** that works seamlessly for both create and edit flows.

---

## 2. Feasibility Assessment

### ✅ What Makes This Achievable

1. **Clean service layer:** `productService.service.ts` and `inventory.service.ts` are already fully decoupled. We can call them in sequence without architectural changes.
2. **Independent state:** Product creation and stock configuration are independent API calls — there is no atomic DB transaction required at the API level.
3. **Existing inventory types:** `StockAdjustPayload`, `StockConfigurePayload`, and `InventoryStockRow` are already typed and exported.
4. **React Query cache:** `queryClient.invalidateQueries` already handles cross-module cache invalidation.

### ⚠️ Key Constraint: Create vs. Edit Asymmetry

- **On CREATE:** A stock row (`InventoryStockRow`) is **auto-created by the backend** when a product is saved. We cannot configure stock *before* creation — we must create the product first, then configure the resulting stock row.
- **On EDIT:** The stock row already exists. All three sections (details, stock settings, stock adjustment) can be pre-filled and submitted independently.

This asymmetry dictates the tab unlock strategy described below.

---

## 3. Architecture: The Unified Flow

### 3.1 Modal Anatomy (Tabbed Structure)

```
┌─────────────────────────────────────────────────────────┐
│  [Product Icon]  Add Product / Edit: Brake Pad Set      │
│  ─────────────────────────────────────────────────────  │
│  [ Details ]  [ Inventory Setup ]  [ Stock Adjustment ] │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  <Active Tab Content>                                   │
│                                                         │
│  [Cancel]                    [Save Changes / Add Product]│
└─────────────────────────────────────────────────────────┘
```

### 3.2 Tab State Rules

| Tab | CREATE mode | EDIT mode |
|---|---|---|
| **Details** | ✅ Always enabled | ✅ Always enabled |
| **Inventory Setup** | 🔒 Locked until product saved, then auto-activates | ✅ Pre-filled from `InventoryStockRow` |
| **Stock Adjustment** | 🔒 Locked until product saved | ✅ Fully available |

### 3.3 CREATE Flow (Step-Locked)

```
1. User fills Details tab → clicks "Create & Continue"
2. Frontend calls: POST /products/ 
3. On success → fetches the new stock row by variant_id
4. Inventory Setup tab auto-unlocks and activates
5. User configures reorder settings → clicks "Save Settings"
6. Frontend calls: PATCH /inventory/stock/{id}/configure/
7. Dialog closes with success toast
```

### 3.4 EDIT Flow (Fully Open)

```
1. Modal opens with all tabs enabled
2. Each tab independently queries/mutates its own endpoint
3. "Save Changes" on Details: PATCH /products/{id}/
4. "Save Settings" on Inventory Setup: PATCH /inventory/stock/{id}/configure/
5. "Confirm Adjustment" on Stock Adjustment: POST /inventory/adjust/
6. Any tab can be saved independently — no forced sequencing
```

---

## 4. Component Architecture

### 4.1 New Files to Create

```
apps/web/src/components/modules/catalog/
├── UnifiedProductDialog.tsx          ← Main orchestrator (replaces CatalogProductDialog)
└── parts/
    ├── ProductDetailsTab.tsx         ← Extracted from CatalogProductDialog form body
    ├── InventorySetupTab.tsx         ← Extracted from StockConfigureSheet
    └── StockAdjustmentTab.tsx        ← Extracted from StockAdjustSheet
```

### 4.2 Files to Modify

```
apps/web/src/components/modules/catalog/
└── CatalogModulePage.tsx             ← Swap CatalogProductDialog → UnifiedProductDialog

apps/web/src/services/modules/
└── inventory.service.ts              ← Add fetchStockByVariantId() helper

apps/web/src/hooks/modules/
└── useInventory.ts                   ← Add useStockByVariantId() hook
```

### 4.3 Files Left Unchanged

```
StockConfigureSheet.tsx               ← Keep as-is (used from Inventory module table)
StockAdjustSheet.tsx                  ← Keep as-is (used from Inventory module table)
```

> **Principle:** Do not delete the existing Inventory sheets. They serve their own context (the Inventory page table rows). The new Unified Dialog is additive, not a replacement of the Inventory module's own tools.

---

## 5. Data Flow & State Design

### 5.1 State Shape in `UnifiedProductDialog`

```typescript
// Mode detection
type DialogMode = "create" | "edit";

// Shared state
interface UnifiedProductDialogState {
  mode: DialogMode;
  activeTab: "details" | "inventory" | "adjustment";
  
  // After creation, we need the new stock row's ID
  createdStockId: number | null;
  createdVariantId: number | null;
  
  // Form states (per tab)
  productForm: ProductFormData;
  inventoryForm: StockConfigureForm;
  adjustmentForm: StockAdjustForm;
  
  // Error states (per tab)
  productErrors: ProductFormErrors;
  inventoryErrors: string | null;
  adjustmentErrors: string | null;
}

interface StockConfigureForm {
  reorder_point: string;
  reorder_qty: string;
  max_stock_level: string;
}

interface StockAdjustForm {
  adjustment_type: "add" | "subtract";
  quantity: string;
  reason: string;
  notes: string;
}
```

### 5.2 New Service Function

Add to `inventory.service.ts`:

```typescript
// Fetches the inventory stock row for a specific product variant
export async function fetchStockByVariantId(variantId: number): Promise<InventoryStockRow> {
  const { data } = await api.get<InventoryStockResponse>("inventory/stock/", {
    params: { variant_id: variantId, page_size: 1 },
  });
  const row = data.results[0];
  if (!row) throw new Error(`No stock row found for variant ${variantId}`);
  return row;
}
```

Add to `useInventory.ts`:

```typescript
export function useStockByVariantId(variantId: number | null) {
  return useQuery({
    queryKey: queryKeys.inventory.stockByVariant(variantId!),
    queryFn: () => fetchStockByVariantId(variantId!),
    enabled: variantId !== null,
  });
}
```

---

## 6. Tab-by-Tab Implementation Specs

### Tab 1: Product Details (`ProductDetailsTab.tsx`)

- **Source:** Extract the existing `<form>` body from `CatalogProductDialog.tsx` verbatim.
- **Props:** `form`, `errors`, `categories`, `sizeOptions`, `onChange`, `onErrorClear`
- **CTA (Create mode):** "Create Product & Continue →" button — triggers product creation, then switches to Inventory tab.
- **CTA (Edit mode):** "Save Product Details" — triggers product PATCH independently.
- **No changes** to existing validation logic.

### Tab 2: Inventory Setup (`InventorySetupTab.tsx`)

- **Source:** Extract from `StockConfigureSheet.tsx`.
- **Props:** `stockRow`, `form`, `isSaving`, `error`, `onChange`, `onSubmit`
- **Lock state:** Disabled with a "Save product details first" hint tooltip when `stockRow` is null.
- **Shows:** Current stock snapshot (on-hand, reserved, available) as read-only info strip.
- **CTA:** "Save Inventory Settings" — triggers PATCH `/inventory/stock/{id}/configure/` independently.

### Tab 3: Stock Adjustment (`StockAdjustmentTab.tsx`)

- **Source:** Extract form body from `StockAdjustSheet.tsx`.
- **Props:** `stockRow`, `form`, `isSaving`, `error`, `onChange`, `onSubmit`
- **Lock state:** Disabled with "Create the product first to adjust stock" hint.
- **Key difference from sheet:** No product variant selector dropdown — the variant is already known from context.
- **Shows:** Current stock snapshot before adjusting.
- **CTA:** "Confirm Stock Adjustment" — triggers POST `/inventory/adjust/` independently.

---

## 7. Implementation Phases (Ordered Checklist)

### Phase 1: Service Layer (Backend contract first)
- [ ] Verify `POST /products/` response includes `variant_id` — check API response type in `catalog.types.d.ts`
- [ ] If `variant_id` is missing from the create response, coordinate with backend to include it
- [ ] Add `fetchStockByVariantId(variantId)` to `inventory.service.ts`
- [ ] Add `useStockByVariantId(variantId | null)` hook to `useInventory.ts`
- [ ] Update `queryKeys` to add `inventory.stockByVariant(variantId)` key

### Phase 2: Extract Tab Components
- [ ] Create `catalog/parts/ProductDetailsTab.tsx` — extract form body from `CatalogProductDialog.tsx`
- [ ] Create `catalog/parts/InventorySetupTab.tsx` — extract and adapt from `StockConfigureSheet.tsx`
- [ ] Create `catalog/parts/StockAdjustmentTab.tsx` — extract and adapt from `StockAdjustSheet.tsx`

### Phase 3: Build the Orchestrator
- [ ] Create `UnifiedProductDialog.tsx`
- [ ] Implement tabbed layout with `Tabs` / `TabsList` / `TabsContent` (line-tab variant)
- [ ] Implement `createdVariantId` state — set after successful product creation
- [ ] Wire `useStockByVariantId(createdVariantId ?? editingProduct?.variant_id)` for inventory data
- [ ] Implement tab disabled/locked logic with `Tooltip` hints for locked tabs
- [ ] Implement "Create & Continue" button flow in CREATE mode
- [ ] Implement independent save handlers in EDIT mode

### Phase 4: Integrate into CatalogModulePage
- [ ] Replace `<CatalogProductDialog>` import with `<UnifiedProductDialog>`
- [ ] Verify all passed props still match the new component's interface
- [ ] Remove orphaned `CatalogProductDialog` import (or rename to `.legacy.tsx` first)

### Phase 5: Regression Testing
- [ ] Test CREATE flow end-to-end: Details → lock → create → auto-unlock → Inventory tab
- [ ] Test EDIT flow: All three tabs open and save independently
- [ ] Verify React Query cache syncs correctly (Catalog + Inventory both refresh after save)
- [ ] Confirm `StockConfigureSheet` and `StockAdjustSheet` in Inventory module still work
- [ ] Run `tsc --noEmit` — zero TypeScript errors

---

## 8. UX Guidance

### Dialog Sizing
Use `sm:max-w-2xl` (wider than the current `sm:max-w-md`) to accommodate the tabbed layout without feeling cramped.

### Tab Lock Visual Treatment

```
Locked tab:  disabled trigger + cursor-not-allowed
             tooltip: "Save product details first to unlock"
             icon: LockIcon (size-3) beside tab label
Active tab:  Racing Orange underline (existing line-tab style)
```

### Success States

| Trigger | Toast Message | Next Action |
|---|---|---|
| Product created (CREATE) | "Product created. Configure inventory below." | Auto-switch to Inventory Setup tab |
| Inventory saved (CREATE) | "Inventory configured. All done!" | Dialog auto-closes |
| Product saved (EDIT) | "Product details updated." | Stay open |
| Inventory saved (EDIT) | "Reorder settings saved." | Stay open |
| Stock adjusted (EDIT) | "Stock adjustment recorded." | Stay open |

### Stock Snapshot Strip
Display on both Inventory Setup and Stock Adjustment tabs as a subtle 3-column read-only row:

```
┌──────────────────────────────────────┐
│  On Hand: 48  Reserved: 3  Available: 45  │
└──────────────────────────────────────┘
```

---

## 9. What We Are NOT Changing

| Item | Reason |
|---|---|
| `StockConfigureSheet.tsx` | Still used in the Inventory module's row-action context — leave untouched |
| `StockAdjustSheet.tsx` | Still used in the Inventory module's table actions — leave untouched |
| Backend API contracts | No backend changes required — all existing endpoints are reused as-is |
| `InventoryModulePage.tsx` | Completely untouched |
| Existing inventory data model | No schema changes needed |

---

## 10. Risk Log

| Risk | Likelihood | Mitigation |
|---|---|---|
| `POST /products/` response does not include `variant_id` | **High** | Check `ProductDto` type first. If absent, either use a follow-up `GET /products/{id}/` call or request backend adds it. |
| Stock row not yet created when we query immediately after product save | Low | Use `retry: 3` on `useStockByVariantId` or a 300ms delay before switching tabs |
| Tab switching loses unsaved form data | Low | All form state lives at `UnifiedProductDialog` level — tab switches do not unmount or reset form state |
| `inventory/stock/` endpoint does not support `?variant_id=X` filter | Medium | Check backend. Fallback: filter client-side from the full stock list using `variant_sku` |
| Dialog becomes too tall on small viewports | Low | Set `max-h-[85vh] overflow-y-auto` on tab content area, not the whole dialog |

---

## 11. Definition of Done

- [ ] A single dialog opens for both creating and editing products
- [ ] CREATE flow: Inventory Setup and Stock Adjustment tabs are locked until product is saved
- [ ] EDIT flow: All three tabs are independently functional and independently saveable
- [ ] No regressions in the Inventory module's existing configure and adjust sheets
- [ ] React Query cache stays consistent — Catalog and Inventory both reflect fresh data after any mutation
- [ ] All TypeScript strict checks pass (`tsc --noEmit` exits cleanly)
- [ ] Visually consistent with "Industrial Atelier" design system

---

*Document path:* `docs/product-inventory-unified-modal-plan.md`  
*Last updated: 2026-05-07*
