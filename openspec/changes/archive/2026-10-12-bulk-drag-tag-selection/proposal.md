## Why

The Employees Tag catalog can reorder only one Tag per gesture, which makes reorganizing a large
catalog unnecessarily repetitive. Users need familiar Ctrl/Command multi-selection and one bulk
drag-and-drop operation that preserves the chosen Tags' relative order.

## What Changes

- Add transient single and additive Tag selection to the Employees Tag catalog, using Ctrl on
  Windows/Linux and Command on macOS.
- Dragging a selected Tag moves the complete selected group as one contiguous block; dragging an
  unselected Tag retains the existing single-row behavior.
- Persist a completed bulk move as one authorized organization change while cancel, invalid, and
  no-op gestures remain write-free.
- Add visible and accessible selection state, grouped drag preview behavior, focused unit/browser
  regression coverage, and relevant documentation.
- Preserve filtered full-catalog insertion, keyboard reordering, ordering consumers, authorization,
  data formats, privacy boundaries, and the existing single-Tag workflow.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `tag-catalog`: Add modifier-based multi-selection and atomic grouped Tag reordering to the
  central catalog.

## Impact

The change affects the Tag catalog dialog, its transient drag state, the catalog-order helper and
store command, focused tests, browser coverage, message catalogs, usage documentation, and the Tag
catalog specification. It adds no dependency, database migration, API shape, remote request,
telemetry, export format, or organization-document field.
