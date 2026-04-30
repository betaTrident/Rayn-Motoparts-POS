# Inventory Modal UX Plan (Adjust Stock + Configure Stock)

## Objective
Replace right-side sheets with centered modals for:
- `Adjust Stock`
- `Reorder/Configure Stock`

Goal: improve focus, readability, and perceived polish while keeping current validation and mutation behavior intact.

## Why Modal Over Sheet
- Better task focus: stock actions are short, form-heavy tasks that benefit from isolated context.
- Better visual hierarchy: table remains background reference while user completes one deliberate action.
- Better consistency: the app already uses dialogs effectively in POS and catalog flows.
- Better mobile behavior control: full-width modal on small screens can be tuned for form completion.

## Current State
- `InventoryModulePage.tsx` opens:
  - `StockAdjustSheet`
  - `StockConfigureSheet`
- Both forms already have good logic:
  - local form state + reset on open
  - error rendering
  - disabled submit rules
  - mutation callbacks from module page

## Target UX
### 1) Adjust Stock Modal
- Title: `Adjust Stock`
- Description: brief purpose line.
- Layout:
  - Variant selector
  - Current stock mini-summary (On hand / Reserved / Available)
  - Adjustment type toggle (Add/Subtract)
  - Quantity
  - Reason
  - Notes
- Footer:
  - Secondary `Cancel`
  - Primary `Save Adjustment`
- Behavior:
  - `Esc`, overlay click, and close button all supported
  - Keep error alert near top
  - Submit button sticky/always visible on small heights

### 2) Configure Stock Modal
- Title: `Reorder Settings`
- Description line.
- Layout:
  - Selected variant identity card (name + SKU)
  - Reorder point
  - Reorder quantity
  - Max stock level (optional)
- Footer:
  - Secondary `Cancel`
  - Primary `Save Settings`
- Behavior:
  - Same close semantics as adjust modal
  - Keep existing numeric guardrails

## Technical Strategy
## A. Keep business logic in page container
Do not move mutation logic from `InventoryModulePage.tsx`.
- Keep:
  - `submitAdjustment`
  - `submitConfigure`
  - error state handling
  - success toast and close behavior
- This keeps architecture clean and predictable.

## B. Replace presentation layer only
- Create:
  - `StockAdjustModal.tsx`
  - `StockConfigureModal.tsx`
- Migrate JSX + form state from sheet components with minimal logic changes.
- Use `Dialog`, `DialogContent`, `DialogHeader`, `DialogFooter` from `ui/dialog.tsx`.

## C. Controlled open state remains unchanged
- Reuse existing booleans:
  - `adjustOpen`
  - `configureOpen`
- Reuse:
  - `selectedStock`
  - `adjustError`
  - `configureError`

## D. Styling decisions
- Desktop:
  - `sm:max-w-lg` for configure
  - `sm:max-w-xl` for adjust
- Mobile:
  - full width with safe margins
  - scrollable body (`max-h` + `overflow-y-auto`)
- Keep visual identity:
  - avoid orange full-header blocks inside modal
  - use cleaner neutral header with strong title hierarchy

## E. Accessibility requirements
- Ensure `DialogTitle` + `DialogDescription` always present.
- Ensure initial focus lands on first actionable input.
- Ensure keyboard-only completion possible.
- Ensure `aria-invalid` for fields if validation evolves later.

## Migration Steps
1. Add new modal components in `inventory/parts`.
2. Port current sheet form logic 1:1 to modal components.
3. Update `InventoryModulePage.tsx` imports and usage.
4. Remove old sheet components (or keep temporarily and deprecate).
5. Run build and verify no type regressions.
6. QA on desktop and mobile viewport.

## Edge Cases to Validate
- Opening `Adjust Stock` from header (no preselected row).
- Opening `Adjust Stock` from a specific row (preselected variant).
- Re-opening modal after failed submit shows clean reset behavior where intended.
- Invalid quantities and negative values stay blocked.
- Long variant names/SKUs wrap cleanly.
- Very long reason/notes do not break modal layout.

## Performance Considerations
- No API contract changes required.
- No additional queries required.
- Pure UI-layer refactor with negligible runtime overhead.

## Risks and Mitigations
- Risk: modal height overflow on small screens.
  - Mitigation: cap content height and use internal scrolling.
- Risk: accidental close while editing.
  - Mitigation (optional phase 2): unsaved changes guard prompt.
- Risk: visual inconsistency with existing Sheet-themed headers.
  - Mitigation: standardize form modal style tokens after this migration.

## Acceptance Criteria
- Both inventory actions use modals (no sheets in these flows).
- Existing stock adjust/configure behavior remains functionally equivalent.
- Form errors, pending state, and success toasts work exactly as before.
- Mobile and desktop interactions remain smooth and readable.

## Recommended Implementation Order
1. `StockConfigureModal` (smaller form, lower risk)
2. `StockAdjustModal` (more controls)
3. Remove or archive `StockConfigureSheet.tsx` and `StockAdjustSheet.tsx`
4. Final polish pass (spacing, button hierarchy, copy)

