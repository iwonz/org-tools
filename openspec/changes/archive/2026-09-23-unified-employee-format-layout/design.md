## Context

Employee display formatting produces rich nodes for Markdown text, Tags, and compound assignments.
The current wrapper sends every semantic node to its own visual row. DOM then uses flex wrapping,
Editor height estimation uses character-count chip widths, and PNG export performs a third Canvas
measurement pass. A long label consequently has different line fragments and height in each path.

Tag visuals are also repeated across cards, forms, virtualized pickers and filters, the catalog,
Calendar, Editor footers, and Canvas. Those copies use different font sizes, padding, truncation,
and fixed row heights. The exact State contract is unaffected by this presentation change.

## Goals / Non-Goals

**Goals:**

- Produce one ordered, width-aware layout of text and semantic inline surfaces for Editor DOM,
  geometry, hit testing, anchors, and PNG drawing.
- Make long Tag and assignment labels complete, grapheme-safe, content-sized, and identically
  decorated across wrapped fragments.
- Centralize normal and compact Tag metrics and apply them to every Tag surface while preserving
  each surface's actions and accessibility.
- Give all six visual Employee format fields the same multiline, token, and Markdown authoring
  behavior.
- Preserve large-organization performance and local-only rendering.

**Non-Goals:**

- Changing persisted formats, State, import/export schema, or SQLite data.
- Interpreting Markdown in plain-text Template output or custom Template field values.
- Removing explicit image font, background, title, or density settings.

## Decisions

### Use a platform-neutral fragment layout

The rich layout accepts resolved display lines, available width, direction, density, locale, and a
text measurement adapter. It returns visual rows containing text fragments and decorated surface
fragments with exact rectangles and source semantics. Text, Tags, and assignments share one cursor;
semantic fields no longer force a flush before and after themselves.

Editor DOM renders the returned rows, its geometry reads their height, and Canvas paints the same
rectangles. The normal DOM surfaces that do not require external geometry use a shared inline
component with the same metrics and cloned box decoration.

Using only common CSS was rejected because Canvas, hit testing, and virtualized geometry would still
have to guess the browser's line breaks. Keeping separate DOM and Canvas packers was rejected
because it is the source of the current defect.

### Clone decoration for every wrapped fragment

Normal density uses 11 px text, 16 px line height, 8 px horizontal and 2 px vertical padding, 6 px
radius, and 4 px gaps. Compact density uses 9 px text, 12 px line height, 6 px horizontal padding,
no extra vertical padding, 6 px radius, and 2 px gaps. A logical surface wraps by words, then by
grapheme cluster. Each line fragment owns content-sized padding, color, radius, and any semantic
border. DOM uses cloned inline decoration; Canvas receives the corresponding fragment rectangles.

Tag fragments retain tonal catalog color without adding a border. Assignment fragments retain a
neutral border and the distinct position, middle-dot, and Unit runs. Dates and counts remain
semantic suffixes that stay together on the last fitting fragment or move to their own fragment.

### Share one Tag surface component and style resolver

A shared Tag surface primitive owns density, catalog color, inline wrapping, search highlighting,
suffixes, and optional action content. Cards, form drafts, pickers, filters, catalog rows, Calendar,
color previews, Editor open positions and footers use it. Fixed-height virtual rows become measured
rows so long labels do not overlap later options. Drag previews use the measured source row.

The color resolver exposes matching CSS variables and Canvas color values. PNG keeps its explicit
light output palette and selected font while preserving the same semantic color, alpha, geometry,
font size, and weight.

### Limit rich authoring to visual formats

The four saved Employee display formats plus the scoped and full-View PNG Employee formats use
`TemplateFormatInput` with token suggestions, newlines, and Markdown selection tools. Both image
dialogs share one token builder that excludes avatar data. The scoped image dialog removes its
token buttons and raw textarea.

Download Template, Editor Template export, and custom Template fields remain token-aware multiline
plain-text formats. They do not expose Markdown tools or reinterpret stored output.

### Bound derived work

Layout caches are bounded and keyed by resolved semantic content, width, direction, locale, density,
and font descriptor. Editor computes each mounted or indexed row layout once per relevant revision
and reuses it for rendering and geometry. Virtualized controls measure only mounted rows and retain
overscan. No organization data leaves the browser or loopback runtime.

## Risks / Trade-offs

- **Browser and Canvas glyph metrics can differ slightly** → Editor DOM consumes explicit shared
  visual rows, and deterministic tests compare fragment rectangles for identical font settings.
- **Variable-height picker rows complicate virtualization** → Use the virtualizer's measurement API,
  stable Tag IDs, width invalidation, and bounded overscan.
- **Cloned inline decoration changes long-chip appearance** → Keep short-chip geometry unchanged and
  add multilingual visual fixtures that exercise only wrapped cases.
- **Shared layout can increase per-row work** → Cache bounded layouts and reuse one result across
  Editor rendering, offsets, anchors, and PNG painting.

## Migration Plan

No data migration is needed. The change can be rolled back with code and documentation only because
the State shape and stored format strings remain unchanged.

## Open Questions

None.
