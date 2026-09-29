## Why

The Editor increased its Unit header from 72 to 88 pixels when two-line summaries were added, but an expanded empty Unit still keeps the former 120-pixel minimum. Its 32-pixel Edit Unit action plus 16 pixels of list padding therefore exceeds the card by 16 pixels and can cover the border or footer.

## What Changes

- Derive the expanded empty-Unit minimum from the shared 88-pixel header, 16-pixel vertical content padding, and 32-pixel empty-state content height.
- Use the corrected 136-pixel geometry for empty manual Units and Live Units without matches while retaining the 88-pixel collapsed height.
- Keep the existing Edit Unit action and Live empty message inside the Unit without clipping intentional external connection controls.
- Propagate the shared height through DOM layout, hierarchy placement, bounds, hit testing, anchors, and full-View or scoped PNG geometry.
- Add deterministic unit, browser, PNG, documentation, and maintained-gallery evidence.

No State, SQLite, localization, export-data, privacy, or network behavior changes. Changing the size or styling of the Edit Unit action and drawing transient empty-state controls in PNG are explicit non-goals.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `organization-editor`: Expanded empty Units reserve enough shared geometry for their complete empty-state content in DOM and PNG.
- `project-tooling`: Browser and gallery checks cover contained empty Unit actions and deterministic geometry.

## Impact

The change affects the shared Editor Unit-height constants and derivation, empty-state DOM containment, Canvas export geometry, Unit layout tests, browser smoke coverage, Editor documentation, and existing gallery output. It adds no dependency and changes no public State or persisted data.
