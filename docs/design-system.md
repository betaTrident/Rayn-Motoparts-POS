# Design System Standards

## Purpose

This document defines UI standards for Rayn Motorparts POS so all screens feel consistent, accessible, and fast to use.

Use these standards for new pages and while refactoring existing ones.

## Design Tokens

Token source: apps/web/src/index.css

Core categories:

- Color tokens: background, foreground, card, primary, accent, muted, destructive, semantic charts
- Radius tokens: --radius-sm through --radius-4xl
- Interaction tokens: border, ring, input, focus outline
- Layout tokens: spacing scale based on 8px rhythm

Rules:

- Never hardcode random colors when a semantic token exists.
- Use semantic intent colors for status:
  - Success: green family
  - Warning: amber family
  - Error: destructive
  - Info: primary/accent
- Use 1 radius family per component type (do not mix many corner styles in one section).

## Typography

Default stack is currently system UI; sizing hierarchy should remain consistent:

- Page title: text-2xl, font-bold, tracking-tight
- Section title: text-base to text-lg, font-semibold
- Body text: text-sm
- Secondary metadata: text-xs, muted foreground

Rules:

- Keep titles short and actionable.
- Avoid using multiple heading styles in the same container level.
- Keep helper text concise and instructional.

## Spacing and Layout

Use an 8px rhythm:

- Dense controls: 8-12px vertical spacing
- Standard cards/forms: 16-24px internal spacing
- Page section spacing: 24px

Shell standards:

- Main content should preserve readable max-width where possible.
- Keep table and card gutters aligned with page padding.
- Avoid sudden layout jumps when async data resolves.

## Component State Standards

Every async data region must include these states:

1. Loading
2. Empty
3. Error
4. Success/content

Implementation reference:

- Shared page state components: apps/web/src/components/ui/page-state.tsx

Rules:

- Loading state must indicate what is loading.
- Empty state must explain why no content is shown and suggest next action.
- Error state must provide a retry action when safe.
- Destructive actions must require confirmation.

## Forms

Form UX standards:

- Label every field clearly.
- Show required/optional intent explicitly.
- Validate as early as practical without being noisy.
- Use field-level messages for specific issues and form-level for server failures.
- Disable submit while mutation is pending and show progress indicator.

## Feedback Patterns

Use consistent patterns for:

- Inline banner for blocking errors in forms
- Status badges for availability/activity
- Dialog confirmations for delete/destructive actions
- Toasts for non-blocking success and informational updates

Copy style:

- Plain language, short sentence, clear next step.
- Prefer "Try again" over technical failure details.

## Accessibility Baseline

Minimum baseline for all pages:

- Keyboard navigation works end-to-end
- Focus states are visible and consistent
- Icon-only actions have accessible labels
- Color is not the only signal for status
- Contrast meets WCAG A/AA targets

Dialog/accessibility specifics:

- Focus should move into dialog on open and return to trigger on close
- Escape closes non-destructive dialogs unless blocked intentionally

## Responsive Behavior

Device priorities:

- Desktop: data-dense workflows (products, dashboard)
- Mobile: critical operations and status checks

Rules:

- Controls should not overflow horizontally in narrow widths.
- Tables should degrade gracefully with truncation and priority columns.
- Ensure tap targets remain usable.

## Implementation Checklist

Use this checklist before marking a UI ticket done:

- Uses semantic tokens and approved spacing/typography
- Includes loading, empty, and error states
- Handles mutation pending/success/error feedback
- Verified keyboard and focus behavior
- Verified mobile behavior for key interactions
- No regressions in existing page workflows
