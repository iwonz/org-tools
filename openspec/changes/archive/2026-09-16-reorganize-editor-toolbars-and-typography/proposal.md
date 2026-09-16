## Why

Editor controls currently split related navigation across the top, duplicate element actions between
context menus and contextual properties, and use inconsistent panel geometry. Canvas typography also
offers families and a medium weight that do not reliably resolve on every local system, while the
tool and export pickers expose different expectations.

## What Changes

- Recompose Editor chrome so View management stays at the top start, structural commands plus View
  Image export occupy the top end, history joins viewport controls at the bottom start, and tools
  plus contextual properties form a bottom-centered dock.
- Give every Editor toolbar surface and button the same background, height, padding, radius, and
  interaction treatment, with collision-free compact and RTL layouts.
- Remove Back, Front, Duplicate, and Delete from contextual properties while retaining them in the
  canvas-element context menu and existing keyboard/history flows.
- Replace the canvas font-weight Select with one accessible Bold toggle and limit current Editor
  canvas and PNG font choices to System and Georgia.
- Preserve old State readability by accepting legacy canvas families and weight 500 while resolving
  them to System and Regular presentation until the next explicit typography edit normalizes them.
- Replace the Sticker tool glyph with a Sticker icon and the percentage reset glyph with a
  magnifying glass.
- Update tests, all six locale catalogs, documentation, capability contracts, and the existing
  59-frame screenshot gallery.
- Preserve the State shape, canvas element geometry, attachments, context-menu commands, PNG scene
  composition, local-only behavior, and all existing keyboard shortcuts. No dependency, migration,
  telemetry, remote font, or network behavior is added.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `organization-editor`: Change Editor toolbar placement and styling, contextual action ownership,
  canvas typography choices and compatibility presentation, and PNG font choices.

## Impact

The change affects Editor toolbar composition, canvas typography rendering and measurement, Image
export settings, strict State font validation, browser tests, all six message catalogs, canonical
Editor documentation, and deterministic screenshots. Existing State remains valid and no public
shape or external API changes.
