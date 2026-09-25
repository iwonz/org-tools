## Context

The scoped Unit image export already renders a fixed-height preview followed by one vertical settings section. The full-View dialog reuses the same preview and control components, but its responsive body changes to a preview/settings grid at the large breakpoint. The narrower settings column makes the number inputs, background selector, and Employee format control visually unstable.

The dialog is transient UI. Its settings draft, export renderer, State contract, and local-only trust boundary do not need to change.

## Goals / Non-Goals

**Goals:**

- Give full-View export the same preview-first, settings-second reading order as scoped export at every viewport width.
- Remove the redundant subtitle and its now-unused localization entry.
- Keep the dialog bounded and scrollable while preserving preview, Copy, and Save behavior.
- Add an observable browser assertion for the layout relationship.

**Non-Goals:**

- Changing image dimensions, density, rendering, settings values, State, SQLite, or export files.
- Restyling the scoped export dialog or introducing a new shared dialog abstraction.

## Decisions

### Use the scoped dialog's vertical composition

The full-View body will use a single vertical flow. Its preview receives the same fixed 360-pixel height as the scoped image preview, and the existing settings section follows it with matching vertical padding. A stable data hook on the settings section lets browser tests compare actual bounding boxes.

Alternative: retain the wide-screen grid and increase the settings-column width. Rejected because it still differs from the requested scoped-export composition and competes with the preview for horizontal space.

### Remove the subtitle entirely

The header will contain only the existing **Export View image** title. The obsolete description key will be removed from all six catalogs so localization parity continues to reject dead public copy.

### Preserve existing data and rendering paths

Only DOM composition changes. Preview calculation, renderer inputs, color selection, format editing, status handling, Copy, and Save continue through their existing paths. No organization value crosses a new boundary, and no additional work is added to large-organization rendering.

## Risks / Trade-offs

- [Settings require scrolling sooner] → Keep the existing bounded dialog and scrollable body, while the predictable one-column layout prevents compressed controls.
- [A future style change could restore side-by-side placement] → Assert that the settings top edge is below the preview bottom edge in the maintained browser workflow.

## Migration Plan

No data migration is required. Deploy and rollback are source-only because the exact State shape and SQLite row are unchanged.

## Open Questions

None.
