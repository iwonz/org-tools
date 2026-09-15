## Why

Canvas-element rotation currently drifts because its pivot does not reliably stay at the geometric
center of the element's current width and height. Selection also remains active after Escape, which
makes it harder to leave an editing state predictably.

## What Changes

- Make single-element rotation use the live center of that element's current rectangular bounds as
  the invariant pivot for every preview sample and final commit.
- Make Escape clear the current Editor selection when a canvas element is selected, while retaining
  the existing priority of cancelling active drafts, menus, and gestures first.
- Add focused geometry, keyboard, and browser regressions for rotated/resized elements and Escape.
- Update the Editor interaction documentation and capability contract.
- Preserve the current state schema, exports, privacy boundary, and canvas-element feature set.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `organization-editor`: Clarify the live geometric-center pivot for single-element rotation and the
  Escape behavior for canvas-element selection.

## Impact

The change affects Editor canvas transform geometry, keyboard command routing, focused tests, and
Editor usage/architecture documentation. It adds no dependency, migration, network request,
localization string, or export-format change.
