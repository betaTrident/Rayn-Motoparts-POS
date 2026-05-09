# Role-Based Catalog Visibility, Size, Variant SKU, and Tax Strategy

## Objective

Implement catalog controls so Admin and Superadmin can decide what Staff can see in product tables, while protecting sensitive fields at the API layer. The immediate product requirements are:

- Staff must not see product or variant cost price unless explicitly allowed.
- Admin and Superadmin can see cost price and selling price.
- Product size should become optional and inputtable instead of limited to fixed choices.
- Product tables should display a Variant SKU column.
- The product taxable switch should expose a tax-rate field so the applied rate is configurable.

This plan is intentionally security-first: UI hiding is only a convenience. Sensitive data must be omitted by the backend response when a user lacks permission.

## Current Findings

The backend is Django REST Framework with JWT authentication and default `IsAuthenticated` permissions in `apps/backend/config/settings.py`.

Catalog products are served by `ProductViewSet` in `apps/backend/catalog/views.py`, using:

- `ProductReadSerializer` for list/retrieve responses.
- `ProductWriteSerializer` for create/update.
- A hard-coded `sizes` action returning `solo`, `small`, `medium`, and `large`.

Product cost data is currently exposed in `ProductReadSerializer` through:

- top-level `cost_price`
- nested `variants[].cost_price`

Product size is stored inside `ProductVariant.attributes["size"]`, but `ProductWriteSerializer.size` is currently a required `ChoiceField`.

Tax rates already exist as `catalog.TaxRate`, and POS checkout uses `variant.product.tax_rate.rate` when `product.is_taxable` is true in `apps/backend/pos/services.py`. However, product creation currently auto-selects `VAT 12%` or the first tax rate, so users cannot configure the rate from the product form.

RBAC exists in `apps/backend/authentication/rbac.py` and `apps/backend/core/management/commands/seed_rbac_data.py`. Existing product permissions include `products:read`, `products:write`, `products:delete`, and `products:pricing`. That gives us a clean place to add field visibility rules.

## Security Model

Use backend-enforced field-level permissions.

Recommended permission keys:

- `products:read` - can access product list/detail.
- `products:write` - can create/update product details.
- `products:delete` - can delete products.
- `products:pricing` - can edit selling price, taxable flag, and tax rate.
- `products:cost` - can view and edit cost price.
- Optional future key: `catalog_visibility:update` or `products:field_visibility` - can configure which Staff-visible columns are enabled.

Baseline role policy:

- Superadmin: all permissions.
- Admin: `products:read`, `products:write`, `products:delete`, `products:pricing`, `products:cost`.
- Staff: `products:read` only, unless Admin/Superadmin later grants specific additional visibility.

Important rule: Staff should not receive hidden fields in API JSON. Do not send `cost_price: null` as the only control if the field name itself implies sensitive data structure. Prefer omitting `cost_price` from staff serializers unless the frontend contract needs stable keys; if stable keys are needed, return `can_view_cost: false` plus no cost values.

## Backend Plan

### 1. Add catalog permission helpers

Create a small backend helper, preferably in `apps/backend/catalog/permissions.py`, that wraps existing RBAC:

- `can_read_products(user)`
- `can_write_products(user)`
- `can_delete_products(user)`
- `can_manage_pricing(user)`
- `can_view_cost(user)`

These should call `authentication.rbac.user_has_permission`. Superuser behavior is already handled there.

Apply these in `ProductViewSet`:

- list/retrieve require `products:read`
- create/update/partial_update require `products:write`
- destroy requires `products:delete`

This closes the current gap where any authenticated system user can hit catalog endpoints if they know the URL.

### 2. Gate sensitive serializer fields

Update `ProductReadSerializer` so cost values are emitted only when `can_view_cost(request.user)` is true.

Recommended implementation:

- Pass request context as already done by the viewset.
- Override `to_representation()` and remove:
  - `cost_price`
  - `variants[].cost_price`
- Include capability metadata:
  - `permissions: { can_view_cost, can_manage_pricing }` or top-level booleans.

Avoid duplicating this logic only in the frontend table. The serializer is the source of truth.

### 3. Protect writes to cost and pricing fields

Update `ProductWriteSerializer.validate()` to enforce:

- `cost_price` can only be submitted by users with `products:cost`.
- `selling_price`, `price`, `is_taxable`, and `tax_rate` can only be submitted by users with `products:pricing`.
- Staff create/update attempts with forbidden fields return `403` or serializer validation error. Prefer view-level `403` for action permission and field-level validation for forbidden fields inside otherwise allowed actions.

For updates, never overwrite cost price from staff-submitted payloads. Keep the previous cost price when permission is missing.

### 4. Make size inputtable and optional

Backend changes:

- Change `ProductWriteSerializer.size` from a required `ChoiceField` to:
  - `CharField(max_length=80, required=False, allow_blank=True, allow_null=True)`
- Normalize size in `validate_size()`:
  - trim whitespace
  - store `None` or omit key when blank
  - optionally title-case only for display, not storage
- In create/update, write `attributes = {}` when size is blank, or `attributes["size"] = normalized_size` when present.
- In `ProductReadSerializer.get_size()` return `None` if not set.
- In `get_size_display()` return `""` or `None` when no size exists.

API compatibility option:

- Keep `/catalog/items/sizes/`, but change it to return distinct sizes currently used in active variants instead of fixed choices. This preserves filter/autocomplete support without enforcing choices.

### 5. Add configurable product tax rate

Expose tax rate IDs through the API.

Backend changes:

- Add `TaxRateSerializer`.
- Add a `TaxRateViewSet` or `ProductViewSet` action such as `/catalog/tax-rates/`.
- Return only active, non-deleted tax rates for product forms.
- Add `tax_rate` or `tax_rate_id` to `ProductReadSerializer`.
- Add `tax_rate` to `ProductWriteSerializer` as `PrimaryKeyRelatedField(queryset=TaxRate.objects.filter(is_active=True, deleted_at__isnull=True), required=False)`.

Validation:

- If `is_taxable = true`, require an active `tax_rate`.
- If `is_taxable = false`, allow tax rate to remain stored but POS must apply `0`; current POS logic already does this.
- Keep a migration-safe default by falling back to `VAT 12%` only for legacy callers that omit `tax_rate` while taxable is true. New UI should always send the selected tax rate.

Tax-rate administration:

- Phase 1: manage tax rates through Django admin, because `TaxRateAdmin` already exists.
- Phase 2: add a Settings page tax-rate module guarded by `settings:write` or a new `tax_rates:write` permission.

### 6. Audit important catalog changes

Use `core.models.AuditLog` or the existing audit approach for:

- role permission changes
- product cost changes
- selling price changes
- tax rate changes
- taxable flag changes

Store old and new values. Do not expose audit logs to Staff.

## Frontend Plan

### 1. Use backend capability flags

Extend product DTO/types in:

- `apps/web/src/types/product.types.d.ts`
- `apps/web/src/types/api/catalog.types.d.ts`
- `apps/web/src/services/productService.service.ts`

Support optional cost fields:

- `cost_price?: string`
- `variants[].cost_price?: string`
- `can_view_cost?: boolean`
- `can_manage_pricing?: boolean`

The UI should hide columns and form controls based on backend capability flags, not only local JWT claims.

### 2. Product table columns

Update `apps/web/src/components/modules/catalog/catalog-product-columns.tsx`:

- Add a `Variant SKU` column using `product.variant_sku`.
- Keep `Product` column for product name, product SKU, part number, and variant count.
- Show `Sell Price` for users allowed to view selling price. Under the current requirement, Staff can see selling price only if Admin/Superadmin enables it; otherwise hide it through the same column-visibility policy.
- Add `Cost Price` only when `can_view_cost` is true and the backend includes cost values.

Also update mobile cards in `CatalogProductsTable.tsx` to show Variant SKU and hide cost consistently.

### 3. Admin-configurable Staff table visibility

Best-practice implementation is a server-owned policy, not localStorage.

Add a backend model such as:

```python
class RoleTableColumnVisibility(TimeStampedModel):
    role = models.ForeignKey("authentication.Role", on_delete=models.CASCADE)
    module = models.CharField(max_length=80)
    table = models.CharField(max_length=80)
    column_key = models.CharField(max_length=120)
    is_visible = models.BooleanField(default=True)
```

Rules:

- Only Admin/Superadmin can configure Staff visibility.
- Superadmin can configure Admin and Staff if desired.
- Sensitive columns still require field permission. A visibility policy cannot make Staff see `cost_price` unless Staff also has `products:cost`.
- Unknown columns default to backend-safe visibility.

Frontend:

- Fetch table policy with products.
- Use TanStack column visibility state to hide/show columns.
- Add a compact Admin/Superadmin-only table settings dialog on the Products page.

### 4. Size input

Update `ProductDetailsTab.tsx`:

- Replace the `Select` for size with a text `Input`.
- Placeholder: `Optional, e.g. Small, 14mm, XL, Pair`.
- Store `size` as `string | null`.

Update TypeScript:

- Replace `ProductSize` union with `string`.
- `ProductFormData.size?: string | null`.
- `SizeOption.value: string` if keeping suggestions.

### 5. Tax-rate selector

Update product form:

- Keep the `Taxable` switch.
- When taxable is enabled, show a `Tax Rate` select.
- Populate from `GET /catalog/tax-rates/`.
- Show rate label such as `VAT 12% - 12.0000%`.
- Validate client-side that taxable products have a selected tax rate.

When taxable is disabled:

- Disable the select or keep it optional.
- Explain in helper text that POS applies zero tax while disabled.

## Data and Migration Plan

1. Add RBAC permission rows:
   - `products:cost`
   - optional `products:field_visibility`
   - optional `tax_rates:read`, `tax_rates:write`

2. Update seed policy:
   - Superadmin receives all.
   - Admin receives cost and tax-rate management.
   - Staff does not receive cost.

3. No database migration is required for optional/inputtable size if size remains in `ProductVariant.attributes`.

4. Add migration only if implementing server-owned table visibility policy.

5. Ensure existing products keep their `tax_rate_id`. New UI should send it explicitly.

## Testing Plan

Backend tests:

- Staff product list does not contain top-level `cost_price`.
- Staff product list does not contain nested `variants[].cost_price`.
- Admin product list contains cost and selling price.
- Superadmin product list contains cost and selling price.
- Staff cannot write `cost_price`.
- Staff cannot change `tax_rate` or `is_taxable` unless granted pricing permission.
- Size accepts blank, null, and arbitrary strings.
- Taxable product creation requires an active tax rate.
- POS checkout uses the selected product tax rate when taxable and zero when not taxable.

Frontend tests:

- Staff table hides Cost Price and any disabled configured columns.
- Admin table shows Cost Price and Variant SKU.
- Variant SKU renders on desktop table and mobile card.
- Product form accepts blank custom size.
- Product form shows tax-rate selector only when taxable is enabled.

Security regression tests:

- Direct API calls as Staff cannot retrieve cost fields.
- Direct API calls as Staff cannot update cost/tax fields.
- A column visibility policy cannot bypass missing backend field permissions.

## Implementation Order

1. Backend RBAC enforcement for catalog actions and cost field filtering.
2. Backend serializer changes for optional size and tax-rate selection.
3. Backend endpoints for active tax rates and dynamic size suggestions.
4. Backend tests for field-level security and POS tax behavior.
5. Frontend type/service updates for optional fields and tax rates.
6. Frontend table update for Variant SKU and role/capability-based columns.
7. Frontend product form update for custom optional size and tax-rate select.
8. Optional Staff column-visibility admin UI with server-owned policy.

## Acceptance Criteria

- Staff cannot see cost price in API responses, browser UI, mobile cards, or variant dialogs.
- Admin and Superadmin can see cost and selling price.
- Product size is optional and accepts custom text.
- Products table includes a Variant SKU column.
- Taxable product creation/editing allows selecting the tax rate.
- POS tax calculation uses the selected tax rate.
- Automated tests cover both authorized and unauthorized paths.

