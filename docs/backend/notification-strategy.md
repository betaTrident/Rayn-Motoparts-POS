# Notification Strategy

## Goal

Provide clear, consistent feedback for user actions using global toasts.

## Current Implementation

- Global toaster is mounted in apps/web/src/App.tsx.
- Toast library: sonner.
- Default placement: top-right.
- Used for product/category create, update, delete, and availability toggle.

## Toast Types

- Success: action completed and data persisted.
- Error: action failed and needs retry or correction.
- Info: optional non-blocking status updates.
- Warning: risky but recoverable states.

## Copy Standards

- Keep title/line short and action-oriented.
- Avoid technical jargon for operators.
- Use clear next-step language on errors.

Examples:

- Product created successfully.
- Unable to update category. Please try again.

## Usage Rules

- Use toasts for cross-page feedback after mutations.
- Use inline field errors for form validation details.
- Do not replace destructive confirmations with toasts.
- Prefer one toast per user action.

## Accessibility

- Toasts are supplementary; important errors should also appear inline when relevant.
- Keep messages concise so screen-reader announcements remain clear.

## Future Extension

- Add optional action button on long-running or undo-capable operations.
- Add deduplication for repeated identical error toasts in rapid retries.
