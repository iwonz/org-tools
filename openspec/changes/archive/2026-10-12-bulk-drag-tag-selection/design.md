## Context

The Tag catalog owns one transient pointer gesture and persists one source/target move only after a
successful release. Rows already have stable IDs, measured positions, filtered full-catalog
insertion, pointer capture, cancellation, auto-scroll, keyboard moves, and revisioned persistence.
There is no selection model, so every gesture can carry only its handle's row.

The catalog array remains the sole durable priority source. Multi-selection is presentation state
only and must never enter the organization document, network payload, audit value, or account UI.

## Goals / Non-Goals

**Goals:**

- Provide conventional plain-click and Ctrl/Command-click Tag selection with an obvious,
  geometry-stable selected state.
- Move any non-contiguous selected Tags as one contiguous block while preserving their catalog
  order and committing exactly one organization change.
- Preserve pointer capture, cancellation, auto-scroll, filtered insertion, authorization, focus,
  keyboard access, and server-refresh safety.

**Non-Goals:**

- Persisting selection across search changes, dialog sessions, reloads, or accounts.
- Adding range selection, drag selection, checkboxes, or a new bulk action toolbar.
- Changing Tag IDs, assignments, exports, database schema, or non-catalog drag-and-drop behavior.

## Decisions

1. Selection lives in `TagCatalogDialog` as ordered Tag IDs. A plain identity activation selects
   one row; Ctrl or Command activation toggles that row. Search changes and dialog closure clear
   selection. An authorized drag started from an unselected row first collapses selection to that
   row, preserving the established one-row gesture.
2. The identity area becomes an `aria-pressed` button while Eye, Color, Edit, Delete, and the drag
   handle remain independent controls. Selected rows use a non-layout outline and `data-selected`
   state rather than a card fill, preserving flat-row geometry and existing hover rules.
3. The drag hook receives selected IDs and captures the visible selected rows at pointer-down.
   It removes those measured slots, inserts the ordered block at one destination, offsets every
   sibling from immutable pre-transform measurements, and renders one inert multi-row overlay plus
   a block-sized placeholder. Pointer-up emits selected IDs and a neighboring target; it never
   mutates state directly.
4. A pure `moveCatalogTags` helper removes unique source IDs in full-catalog order and reinserts
   them before or after one target. The store applies the returned array once and rebuilds the main
   model once. Missing IDs, a target inside the source group, and unchanged results are no-ops.
   The existing single-Tag API delegates to the same helper.
5. Arrow-key reordering carries the focused row's selected block when that row is selected and
   otherwise carries only the focused row. This keeps keyboard behavior equivalent to pointer
   behavior without introducing a separate command surface.

## Risks / Trade-offs

- **Selected non-contiguous rows collapse into a block after drop.** → Preserve their original
  relative catalog order and preview the exact final block before commit.
- **Nested row controls could accidentally change selection.** → Put selection on the dedicated
  identity button only; action controls keep their existing behavior.
- **A server refresh can invalidate captured IDs or measurements.** → Catalog identity changes
  cancel the gesture, and selection is intersected with the current authorized catalog.
- **Large selections could make preview work quadratic.** → Build sets/maps once per gesture and
  compute slot ordering linearly; the drag remains bounded by the already-rendered catalog rows.

## Migration Plan

No data or database migration is required. Deployment changes only client behavior. Reverting the
change restores single-row selection and dragging without transforming stored catalogs.

## Open Questions

None.
