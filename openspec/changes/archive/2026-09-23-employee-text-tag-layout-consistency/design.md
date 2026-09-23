## Context

Employee rich layout currently assigns exact fragment rectangles before DOM rendering. Text and Tag
widths use several independent character-count estimates, while the browser and PNG canvas draw real
fonts. Narrow estimates clip email and username endings; wide estimates leave false trailing space in
dated Tags and counted Unit-footer Tags. The same semantic Tag is also rendered with two metric sets
and several ad hoc collection gaps.

The Editor uses rich-layout height for virtualization, Unit bounds, hit testing, and anchors, so a
visual-only CSS fix would leave geometry and PNG output inconsistent. The maintained scale target is
20,000 Employees and 4,000 Units, fonts are bundled locally, and no organization data may leave the
browser or loopback runtime.

## Goals / Non-Goals

**Goals:**

- Measure every runtime Employee text and semantic-surface fragment with its actual target font.
- Give all Tag, dated-Tag, counted-Tag, and assignment surfaces one metric contract.
- Keep DOM, Editor geometry, and PNG output on one set of fragment rectangles and row offsets.
- Preserve complete multilingual values, word/grapheme wrapping, local-only behavior, and bounded
  layout work.

**Non-Goals:**

- Change Employee formats, line-gap State, Tag data, localization copy, import/export schemas, or
  SQLite.
- Add remote fonts, dependencies, telemetry, or runtime compatibility branches.
- Change Tag colors, ordering, search semantics, or navigation behavior.

## Decisions

### Use one semantic-surface metric set

`TagSurface` and every layout helper will use one constant with 11 px font size, 16 px line height,
8 px inline padding, 2 px block padding, 6 px radius, and 6 px row and column gaps. Density arguments,
compact constants, and caller-specific overrides will be removed. Assignment surfaces use the same
geometry while retaining their neutral fill, border, emphasized position, middle dot, and secondary
Unit text.

Using the former normal size everywhere is intentional. Keeping two named densities would preserve
the source of cross-surface drift and would not satisfy the selected one-density behavior.

### Measure target typography through a bounded Canvas engine

A shared measurement engine will accept text plus a resolved typography descriptor: font family,
size, weight, style, and semantic role. It will set those properties on a local 2D context and cache
`TextMetrics.width` by the complete descriptor and text. The cache has a fixed upper bound and LRU
eviction. A deterministic estimate remains only when Canvas is unavailable to pure unit tests; every
browser, Editor, preview, and PNG runtime caller supplies a real context-backed measurement.

DOM callers resolve the bundled UI font from computed style after mount and invalidate measured
layout after local fonts finish loading, locale/direction changes, or the font signature changes.
PNG callers use their existing local measure canvas and the selected export font after its font-load
barrier. No font or text is sent over the network.

### Make typography part of the layout contract

The rich layout measure callback will receive semantic typography rather than only text and density.
Plain, bold, italic, code, Tag, assignment-position, and assignment-Unit ranges can therefore use the
same weights and families that DOM and Canvas draw. Tag dates and footer counts are measured as
suffix ranges inside the same logical surface. A suffix stays whole on the last fitting fragment or
moves to its own decorated continuation fragment.

DOM text fragments will use measured positions without applying an independently clipping width to
their glyph box. The containing visual row remains the available-width clipping boundary after the
layout has already wrapped content.

### Distinguish semantic-wrap and format-row gaps

Visual rows record whether the following row continues a Tag or assignment flow. Such boundaries use
the fixed 6 px semantic gap. Boundaries produced by authored newlines, authored blank rows, ordinary
text wrapping, or dynamic conditions use the stored format line gap. Neither class adds space before
the first or after the last row. Standalone Tag collections use 6 px in both axes.

The resulting per-boundary offsets, rather than a `row count × one gap` shortcut, drive total height,
Editor row stacks, Unit bounds, virtualization, hit testing, anchors, and PNG baselines.

### Keep one layout result per target

List cards and previews measure the mounted information-column width and UI font, then render their
shared layout. Editor DOM computes each visible row layout once and reuses it for rendering and every
geometry consumer. PNG computes the same model with the chosen image font and uses its rectangles
directly for drawing. Unit-footer and open-position Tag layouts accept the same measurement service
instead of re-estimating widths.

### Keep the Reset correction local

The Display Reset action retains the shared link-button behavior and accessibility but explicitly
overrides the shared button's semibold default with normal weight. No catalog copy changes.

## Risks / Trade-offs

- **Unified Tags increase Editor row and Unit heights** → Recompute every dependent bound and anchor
  from the shared layout and cover collapsed, virtualized, and PNG geometry.
- **Canvas measurement can be expensive at large scale** → Reuse one context per target, bound text
  and layout caches, measure only mounted list rows, and preserve cached Editor derivations.
- **Fonts may become ready after the first mount** → Use the local font-load barrier and invalidate
  affected caches and layouts once, without persisting any state.
- **Canvas advance width and glyph ink can differ slightly** → Avoid clipping individual DOM text
  fragments and assert complete glyph bounds in browser tests.
- **Mixed text and semantic wrapping needs different vertical gaps** → Store boundary metadata in the
  layout and test mixed, Tag-only, assignment-only, authored, and empty-row sequences directly.

## Validation record

The configured owned SQLite already had the current exact State shape. Its single row remained at
revision 33297 with identical organization and UI SHA-256 values before and after a production
server startup and `/api/state` read through `StateRepository` and `parseOrgToolsState`; no backup or
conversion was required. Both maintained browser runtimes passed, including the 20,000 Employee and
4,000 Unit scenario. Two final gallery generations produced the same 59 SHA-256 values, and every
frame was visually inspected.
