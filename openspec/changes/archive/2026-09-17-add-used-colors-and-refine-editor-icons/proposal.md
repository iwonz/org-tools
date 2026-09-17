## Why

The shared color picker makes arbitrary colors available but does not surface colors already used in
the organization, forcing users to remember or re-enter them. The Editor tool icons also need a
clearer visual distinction: Arrow should communicate a one-ended Bezier arrow and Image should use
a visibly rounded picture glyph.

## What Changes

- Add a compact Used colors section to every shared color Popover, derived from global Tags and all
  View documents, including inactive Views.
- Preserve exact RGB and alpha when reusing a color, deduplicate equivalent rendered RGBA values,
  and keep the existing draft plus Apply/Cancel transaction.
- Replace the Arrow tool glyph with one cubic Bezier curve, a free start, and a filled triangular
  end marker.
- Replace the Image tool glyph with the bundled rounded-square photo icon.
- Keep the derived palette local and non-persistent; do not add history, State fields, storage,
  network work, or Image-export color integration.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `tag-catalog`: The shared color picker exposes deduplicated colors configured across the current
  organization as compact alpha-aware swatches.
- `organization-editor`: Editor color consumers share the organization-wide used-color palette and
  the Arrow and Image tools use the refined glyphs.
- `project-tooling`: Browser and deterministic gallery validation cover used-color reuse and the
  refined Editor icons without increasing the screenshot catalog.

## Impact

The change affects shared color helpers and the color Popover, the organization/View derived store
model, Editor tool icon composition, all six locale catalogs, browser tests, documentation, OpenSpec
capability specs, and maintained screenshots. `EmployeeTagColor`, `TagColorPicker` callbacks, the
strict State shape, SQLite data, export formats, and runtime privacy boundaries remain unchanged.
