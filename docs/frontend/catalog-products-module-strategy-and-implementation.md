# Catalog/Products Module Strategy and Implementation

## Goal
Align the Catalog/Products page with backend product attributes, improve usability of create/edit flows, make filters more compact, and present clearer product health KPIs for clients.

## Problem Summary
- Product modal previously used a simplified UI contract (`price`, `is_available`) that did not fully reflect backend product attributes.
- Product table headers did not expose key backend-identifying attributes (SKU, part number).
- Search toolbar had extra vertical spacing and felt visually loose.
- Summary cards were not optimized for day-to-day product catalog monitoring.

## Backend Attribute Alignment Plan
### Phase 1: Expand backend read/write schema (backward-compatible)
- Add read fields from backend product model to product response:
  - `sku`, `part_number`, `cost_price`, `selling_price`, `is_active`, `is_taxable`, `is_serialized`, `variant_sku`, `variant_name`, `uom_code`, `tax_rate_name`
- Keep compatibility aliases:
  - `price` (maps to effective selling price)
  - `is_available` (maps to `is_active`)
- Expand write serializer to accept:
  - `sku`, `part_number`, `cost_price`, `selling_price`, `variant_sku`, `variant_name`, `is_active`, `is_taxable`, `is_serialized`
- Keep compatibility writes:
  - `price`, `is_available`

### Phase 2: Align frontend domain and API types
- Update DTO and domain interfaces so Catalog page can consume backend attributes directly.
- Keep legacy aliases in mapped `Product` object to avoid regressions in existing components.

### Phase 3: Update create/edit modal to backend-aligned attributes
- Product identity fields: `sku`, `part_number`, `name`
- Classification fields: `category`, `size`
- Commercial fields: `cost_price`, `selling_price`
- Variant fields: `variant_sku`, `variant_name`
- Product flags: `is_active`, `is_taxable`, `is_serialized`
- Preserve payload compatibility by still passing `price` and `is_available` aliases.

## Catalog UX/UI Implementation Plan
### Table/Header alignment
- Replace generic table columns with backend-aligned columns:
  - `SKU`, `Product`, `Category`, `Part #`, `Size`, `Sell Price`, `Active`, `Actions`

### Search compactness
- Reduce toolbar padding and gap.
- Reduce control heights (`Input`/`Select`/Clear button) to make the search/filter row compact.
- Improve search placeholder to explain supported keys.

### Useful KPI cards (standard catalog monitoring)
- `Total Products`
- `Active Listings`
- `Inactive Listings`
- `Avg Sell Price`

## Implemented Changes
### Backend
- Updated product serializers in [apps/backend/catalog/serializers.py](apps/backend/catalog/serializers.py):
  - Expanded read contract with backend product attributes.
  - Expanded write contract for create/update to accept backend-aligned fields.
  - Added backward-compatible handling for legacy `price` and `is_available`.

### Frontend types/service
- Updated API DTO contract in [apps/web/src/types/api/catalog.types.d.ts](apps/web/src/types/api/catalog.types.d.ts)
- Updated frontend product domain types in [apps/web/src/types/product.types.d.ts](apps/web/src/types/product.types.d.ts)
- Updated mapper compatibility in [apps/web/src/services/productService.service.ts](apps/web/src/services/productService.service.ts)

### Catalog module page
- Updated create/edit product modal fields in [apps/web/src/components/modules/catalog/CatalogModulePage.tsx](apps/web/src/components/modules/catalog/CatalogModulePage.tsx)
- Updated table headers and row values to backend attributes.
- Compact search toolbar spacing and control heights.
- Replaced stat cards with client-meaningful catalog KPIs.
- Updated status handling from availability wording to active/inactive wording in the products context.

## Validation Checklist
- Type and editor diagnostics pass for changed files.
- Product create/edit supports both backend-aligned fields and legacy aliases.
- Product list/table now exposes backend identifying attributes.
- Search and filter toolbar is more compact.

## Recommended Next Steps
1. Add backend tests for Product serializer create/update payload combinations (`price` only, `selling_price` only, both).
2. Add frontend e2e tests for modal submission and table/header rendering.
3. Consider introducing dedicated endpoints for selectable `brand`, `uom`, and `tax_rate` if those should be user-configurable in UI.
4. Optionally add server-side search wiring in query call (`search` param) for large catalogs.
