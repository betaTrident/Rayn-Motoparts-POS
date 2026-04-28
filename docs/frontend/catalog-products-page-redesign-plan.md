# Catalog Products Page Redesign Plan

## Objective
Redesign the catalog/products page so the products workspace feels cleaner, more organized, and easier to operate day to day. The implementation should replace the current hand-built products table with the shared `DataTable`, upgrade the tab experience, and make search/filter controls more structured and scalable.

## Primary Recommendation
Use a focused refactor instead of layering more styling onto the existing page. The best long-term solution is:

1. Upgrade the shared `DataTable` into a real page-level table primitive.
2. Migrate the products view in `apps/web/src/components/modules/catalog/CatalogModulePage.tsx` to that `DataTable`.
3. Replace the custom `TabButton` pattern with the shared `Tabs` primitive from `apps/web/src/components/ui/tabs.tsx`.
4. Rebuild search and filters as a compact toolbar with clear hierarchy and predictable state.
5. Keep dialogs and mutations intact while extracting table/filter concerns into smaller units.

This gives the page a better UX immediately and also reduces future maintenance cost.

## Current State Assessment
The current products page already has useful data and actions, but the structure is doing too much in one file and is limiting UX quality.

### Observed issues
- `CatalogModulePage.tsx` mixes data fetching, filtering, tabs, tables, dialogs, stats, and form state in one large component.
- The products table is manually rendered with `Table`, so sorting, reusable empty states, and column behavior are page-specific instead of shared.
- The current tabs use a local `TabButton` helper near the bottom of the file instead of the shared `Tabs` primitive, which creates styling drift and duplicate interaction logic.
- Search and filter controls are functional but visually flat and operationally basic; they do not feel like a deliberate catalog toolbar.
- Product filtering is entirely client-side even though `productService.getProducts()` already supports filters.
- The shared `DataTable` is currently too minimal for this page and needs to be expanded before it becomes the foundation.

### Relevant files
- `apps/web/src/components/modules/catalog/CatalogModulePage.tsx`
- `apps/web/src/components/ui/data-table.tsx`
- `apps/web/src/components/ui/tabs.tsx`
- `apps/web/src/services/productService.service.ts`
- `apps/web/src/types/product.types.d.ts`

### Technical risk to address first
`apps/web/src/components/ui/data-table.tsx` imports `@tanstack/react-table`, but that dependency is not declared in `package.json`. Before migration, validate whether it is available transitively or add it explicitly.

## UX Direction
The page should feel like a clean operational workspace rather than a generic admin screen.

### Visual principles
- Minimalist, not empty: fewer competing borders, stronger spacing rhythm, deliberate use of muted surfaces.
- Organized hierarchy: summary first, navigation second, filters third, data fourth.
- Fast scanning: product identity, category, price, and status should be readable within one glance.
- Low-friction actions: edit, activate/deactivate, and delete should be obvious without making the row visually noisy.
- Compact controls: tabs, filters, and table chrome should feel refined and space-efficient, not oversized.

### Intended layout
1. Page header with primary action.
2. Compact KPI row.
3. Tab shell with improved triggers and counts.
4. Products toolbar with search, category, status, and reset.
5. Data table with stronger row hierarchy.
6. Lightweight footer with result count and pagination.

## Strategic Solution

### 1. Make `DataTable` the real foundation
Do not just swap `<Table>` to `<DataTable>` and keep the rest unchanged. First improve `DataTable` so it supports the catalog use case well.

#### Recommended `DataTable` capabilities
- Column definitions via TanStack Table.
- Sorting support for key columns.
- Reusable empty state slot.
- Reusable loading state slot.
- Optional toolbar slot above the table.
- Optional footer slot below the table.
- Optional row click support.
- Consistent table density and header styling.

#### Why this is the best approach
- Prevents the products page from becoming another one-off table implementation.
- Lets the same component power future modules like categories, inventory, and transactions.
- Keeps table behavior standardized across the app.

### 2. Replace the custom products table with column definitions
Move the products table markup in `CatalogModulePage.tsx` into declarative `ColumnDef<Product>[]` columns.

#### Recommended product columns
- `Product`
- `Category`
- `Size`
- `Sell Price`
- `Status`
- `Actions`

#### Product cell behavior
- `Product` should combine name, SKU, part number, and optional description in one structured cell.
- `Category` should remain a compact badge.
- `Sell Price` should use right-aligned tabular numbers.
- `Status` should use a quiet badge with a small status dot.
- `Actions` should keep the current behavior but reduce button clutter by favoring one primary row action plus overflow menu.

### 3. Replace `TabButton` with shared `Tabs`
Use the shared tabs primitive instead of the custom underline button approach, but keep the line-tab style in a cleaner and more minimal form.

#### Recommended tab behavior
- Use `Tabs`, `TabsList`, `TabsTrigger`, and `TabsContent`.
- Keep two tabs: `Products` and `Categories`.
- Include counts inside each trigger using compact badges.
- Keep the line-tab pattern, but refine it:
  - thinner underline
  - smaller vertical footprint
  - quieter inactive state
  - clearer active state through text emphasis plus line accent
- Make the list wrap gracefully on smaller screens.

#### Why this is better
- Uses the shared design system instead of custom page-only controls.
- Improves keyboard accessibility and consistency.
- Makes the catalog tabs easier to reuse elsewhere.

### 4. Rebuild search and filters as a catalog toolbar
The toolbar should feel like one system instead of separate loose controls.

#### Recommended toolbar structure
- Left: search input with icon and clear action.
- Right: category filter, status filter, optional quick clear button.
- Secondary metadata line: result count and active filter summary.

#### Recommended behavior
- Use `useDeferredValue` for the search term before applying expensive filtering or query invalidation.
- Prefer server-side filtering through `productService.getProducts(filters)` for category, availability, and search when practical.
- Keep a `clearFilters()` path that resets all controls in one action.
- Preserve filter state when switching tabs so the user does not lose context.
- Ensure the category and status dropdown menus open below their trigger controls, not overlaid in a way that feels attached to or replaces the trigger content.
- Improve the search field so it feels like a primary workspace control rather than a default input.

#### Why this is the best practice
- Keeps the UI responsive.
- Makes the module scalable for larger catalogs.
- Aligns the frontend with the service layer that already accepts filters.

### 5. Improve table readability and rhythm
The products table should feel lighter, easier to scan, and more premium without becoming visually busy.

#### Recommended table presentation
- Add alternating row backgrounds with subtle striping:
  - odd rows: white or base surface
  - even rows: light neutral gray tint
- Keep hover state distinct from striping so interaction still reads clearly.
- Increase header font size slightly above row content.
- Use stronger header weight and muted uppercase only if it still feels readable; avoid headers becoming too faint.
- Make row text slightly smaller than headers, but not tiny.
- Keep row height comfortable enough for product metadata without feeling oversized.

#### Recommended typography hierarchy
- Table headers:
  - slightly larger than body text
  - semibold
  - higher contrast than current implementation
- Table body:
  - clear primary text for product names
  - softer secondary text for SKU, part number, and description
- Numeric columns:
  - tabular numerals
  - consistent alignment

### 6. Add pagination as a first-class table behavior
Pagination should be part of the redesigned table experience, not an afterthought in the footer.

#### Recommended pagination behavior
- Add page size and page index support through `DataTable`.
- Display previous/next controls plus current page context.
- Keep result count visible near pagination.
- If data remains client-loaded initially, paginate the filtered dataset in the table layer.
- If product queries move server-side, evolve pagination to query-backed state without changing the page layout.

#### Why pagination belongs in this redesign
- Prevents long product lists from becoming visually heavy.
- Improves scan speed and control.
- Makes the page future-ready for larger catalogs.

### 5. Reduce `CatalogModulePage` complexity
The current file should be split by responsibility.

#### Recommended extraction
- `CatalogProductsToolbar`
- `CatalogProductsTable`
- `CatalogCategoriesPanel`
- `catalog-product-columns.tsx`
- `useCatalogProductFilters` or `useCatalogProductsView`

#### Outcome
- The page becomes easier to read.
- Table, toolbar, and filter logic become testable in isolation.
- The products redesign becomes easier to extend without destabilizing dialogs and mutations.

## Implementation Plan

### Phase 1. Foundation hardening
- Validate and explicitly install `@tanstack/react-table` if missing from direct dependencies.
- Expand `apps/web/src/components/ui/data-table.tsx` to support:
  - sorting
  - empty state rendering
  - loading state rendering
  - optional toolbar
  - optional footer
  - pagination
  - consistent container styling
- Keep the `DataTable` API generic so it stays reusable outside catalog.

### Phase 2. Products table migration
- Create `catalog-product-columns.tsx` with `ColumnDef<Product>[]`.
- Move row presentation into column cells instead of inline JSX inside `CatalogModulePage.tsx`.
- Replace the current hand-built `<Table>` block with `<DataTable columns={...} data={...} />`.
- Apply alternating row backgrounds and improved header/body typography hierarchy inside the table shell.
- Preserve current actions:
  - edit
  - activate/deactivate
  - delete

### Phase 3. Tab redesign
- Remove the local `TabButton` helper from `CatalogModulePage.tsx`.
- Replace manual `activeTab` rendering with the shared `Tabs` component.
- Keep the `line` tabs variant, but refine it:
  - slimmer line indicator
  - more compact trigger height
  - cleaner spacing between tabs
  - count badges that do not overpower the label
- Ensure mobile wrapping and keyboard navigation work correctly.

### Phase 4. Toolbar redesign
- Extract the products toolbar into its own component.
- Add a consistent compact control height across `Input`, `Select`, and `Button`.
- Make search the dominant control visually.
- Add result feedback below or inside the toolbar:
  - `Showing X of Y products`
- Keep `Clear filters` visible only when filters are active.
- Ensure filter dropdown panels are positioned below the trigger and visually detached enough to read as menus, not trigger content.

### Phase 5. Data flow improvement
- Move from pure client-side filtering toward query-driven filtering using `productService.getProducts(filters)`.
- Use query keys that include:
  - search
  - category
  - availability
- Use deferred search input to avoid excessive refetching.
- If server-side search is incomplete, keep a thin client-side fallback only where necessary.

### Phase 6. Cleanup and refinement
- Reduce visual noise in row actions.
- Normalize spacing between KPI cards, tabs, toolbar, and table.
- Keep empty/error/loading states visually aligned with the new table shell.
- Review category tab layout so it matches the new products experience.
- Fine-tune dropdown menu spacing and portal behavior so select content consistently appears below its trigger.

## Recommended File Changes

### Update
- `apps/web/src/components/ui/data-table.tsx`
- `apps/web/src/components/ui/tabs.tsx`
- `apps/web/src/components/modules/catalog/CatalogModulePage.tsx`
- `apps/web/src/components/ui/select.tsx`

### Add
- `apps/web/src/components/modules/catalog/catalog-product-columns.tsx`
- `apps/web/src/components/modules/catalog/CatalogProductsToolbar.tsx`
- `apps/web/src/components/modules/catalog/CatalogProductsTable.tsx`

### Optional add
- `apps/web/src/components/modules/catalog/useCatalogProductsView.ts`

## Best-Practice Notes

### State management
- Keep mutation/dialog state local to the page.
- Move filter and table presentation state out of the monolith.
- Avoid duplicating derived counts between toolbar and footer without a shared source.

### Performance
- Use deferred search input.
- Memoize column definitions when they depend on callbacks.
- Prefer server-side filtering for scalability.
- Keep pagination state local to the table layer unless the API becomes paginated.

### Accessibility
- Use the shared `Tabs` primitive for keyboard and screen-reader behavior.
- Ensure action buttons and overflow menus keep descriptive `aria-label`s.
- Keep clear empty and error states inside the table shell.

### Design consistency
- Reuse shared primitives instead of page-only tab components.
- Keep the products and categories areas visually related.
- Use one spacing scale and one row-density scale throughout the module.
- Use one neutral row-striping treatment across all data-heavy module tables if this pattern is adopted.

## Acceptance Criteria
- Products table uses `DataTable`, not the hand-built `Table` block.
- Tabs use the shared `Tabs` primitive, not `TabButton`, while preserving a cleaner line-tab style.
- Search and filters are visually compact, aligned, and easy to scan.
- Filter dropdown content opens below the trigger in a clean, readable way.
- The products workspace looks cleaner and more organized on desktop and mobile.
- Sorting and empty/loading behavior live in `DataTable`, not only in `CatalogModulePage`.
- Pagination is present and visually integrated with the table footer.
- Table headers are slightly larger and stronger than row text.
- Alternating row colors improve scanability without making the table noisy.
- Existing product actions and dialogs continue to work.

## Validation Checklist
- `npm run lint`
- `npm run test:run`
- Manual check on desktop and mobile widths
- Verify:
  - tab switching
  - search
  - category filter
  - status filter
  - dropdown positioning below trigger
  - clear filters
  - pagination
  - edit product
  - activate/deactivate
  - delete product

## Final Recommendation
The best implementation is a component-led refactor, not a surface-level restyle. If we want the products page to feel intentionally designed and remain maintainable, the right move is to strengthen the shared `DataTable`, adopt the shared `Tabs` primitive, and separate toolbar/table responsibilities before applying the final UI polish.
