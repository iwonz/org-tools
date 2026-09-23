## Why

Employee display Tags currently use three different layout paths: the rich formatter separates
semantic fields from adjacent text, DOM relies on flex wrapping, and PNG export measures its own
multi-line rectangles. Long labels therefore consume different space on screen and in exported
images, can leave unused colored width, and can desynchronize Editor row geometry from the pixels
that are drawn.

Visual Employee format inputs are also inconsistent: the scoped PNG dialog still exposes token
buttons and a plain textarea, while the other visual format surfaces use the shared token-aware
input with only some enabling Markdown tools.

## What Changes

- Introduce one width-aware rich layout contract for text, inline Markdown, Tags, and compound
  assignments, with shared DOM and Canvas geometry.
- Render an oversized Tag or assignment as content-sized decorated inline fragments, wrapping by
  words and then grapheme clusters without truncation or unused full-row fill.
- Centralize normal and compact Tag-surface metrics, colors, wrapping, and interactive-state
  behavior across cards, controls, Editor surfaces, and PNG output.
- Make every visual Employee format field use the shared multiline input with `@` suggestions and
  Markdown selection tools, and remove the remaining token-button catalog.
- Keep plain-text Template exports and custom Template fields token-aware and multiline without
  interpreting Markdown.
- Preserve local-only rendering and the existing exact State contract; no migration is required.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `employee-model`: Employee rich content and every Tag assignment surface share inline wrapping,
  density, and visual semantics.
- `organization-editor`: Editor DOM, variable row geometry, Tag footers, open positions, and PNG
  consume one measured layout.
- `data-export`: Both visual Employee image formats expose the same token and Markdown editor and
  draw the shared fragment layout.
- `dated-employee-tags`: Long dated labels remain complete and consistently decorated wherever
  Tags appear.
- `tag-catalog`: Catalog, filter, picker, Calendar, and color-preview Tag surfaces use the shared
  wrapping treatment.
- `interface-chrome`: Tag-like controls retain their configured tonal identity while wrapping.
- `project-tooling`: Browser and screenshot coverage verify the unified visual contract.

## Impact

The Employee display renderer, Editor geometry and Canvas exporter, Tag UI primitives, virtualized
Tag lists, visual format dialogs, browser tests, screenshots, capability specs, and supporting
documentation change. The strict organization State, import/export schema, stored formats, local
SQLite data, dependencies, and network behavior remain unchanged. Plain-text Template output does
not gain rich rendering.
