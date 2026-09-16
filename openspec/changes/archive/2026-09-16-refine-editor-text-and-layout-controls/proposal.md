## Why

Editor layout controls currently duplicate arrangement, persistent text elements cannot format a
selection or keep their height synchronized with content, and their tool icons and settings chrome
do not communicate the intended canvas behaviors. The Editor needs one predictable Miro-like text
workflow whose live canvas and local PNG output remain visually equivalent.

## What Changes

- Remove redundant Editor dividers and the standalone Arrange action; every layout-direction press
  arranges the current hierarchy or selected Unit group, including a repeated press of the active
  direction.
- Replace Text, Arrow, and Sticker tool glyphs with unambiguous local vector icons.
- Extend persistent Text elements with normalized inline-format runs, automatic or fixed width,
  derived height, and none/block/per-line fill modes.
- Add selection-aware local rich-text editing with plain-text paste, mixed-value properties, and
  single-command completion while keeping Sticker editing plain-text.
- Render mixed typography, automatic geometry, and Text fills through one shared DOM/PNG layout.
- Offer System, Georgia, Bebas Neue, Lobster, and Montserrat in every Editor font picker using only
  locally available or bundled fonts.
- Accept the immediately preceding plain Text element shape and normalize it locally so an existing
  SQLite state or explicit State import does not fail as corrupted.
- Update the Editor capability, documentation, localized catalogs, tests, and existing screenshot
  scenarios without adding remote requests or new export formats.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `organization-editor`: Change toolbar arrangement semantics, Text persistence and editing,
  canvas typography and fills, font choices, transform behavior, and matching PNG output.

## Impact

This affects shared Editor types, strict State parsing, canvas layout and interaction helpers,
Editor toolbars and text rendering, both Editor PNG dialogs, local font dependencies in server and
Pages builds, six message catalogs, browser fixtures, tests, and Editor documentation. The change
adds no telemetry, remote fonts, remote assets, migration service, Employee/Unit schema changes, or
changes to JSON, Template, or general Employee export.
