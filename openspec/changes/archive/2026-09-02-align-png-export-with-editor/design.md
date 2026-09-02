## Context

The live Editor card and the PNG renderer currently describe the same Unit with different geometry.
The DOM uses a 72 px header, 8 px list padding, centered 20 px avatars, a 44 px text-column origin,
12 px Employee text, and compact 9 px tags. The renderer uses a 64 px header, top-aligned avatars,
a 36 px text origin, larger tags, a different row-height calculation, and no Unit identity icon or
boss badge. These independent values explain the visible horizontal and vertical drift and can also
move hierarchy connector endpoints.

PNG export is local and deterministic. It supports custom image padding, radius, font, title,
background, scope, Employee template, and boss label, so replacing it with a raw DOM screenshot
would remove intentional output controls and make large exports dependent on viewport rendering.

## Goals / Non-Goals

**Goals:**

- Make default PNG Unit cards visually and geometrically consistent with the live Editor.
- Align Unit headers, summaries, Employee avatars, names, tags, boss indicators, row heights, and
  connection anchors from one shared set of layout metrics.
- Preserve deterministic bounded canvas rendering, embedded-avatar safety, and current export
  controls.
- Cover the shared geometry and actual browser-generated PNG preview with automated tests and the
  maintained screenshot gallery.

**Non-Goals:**

- Pixel-capture the DOM or export transient hover, focus, selection, drag, or toolbar state.
- Change Unit coordinates, Editor layout, organization state, persistence, transfer, MCP, or image
  scope semantics.
- Remove configurable image fonts, titles, backgrounds, radius, templates, or boss copy.
- Introduce a remote renderer, font, icon, image, or runtime dependency.

## Decisions

### Reuse the live Editor's pure geometry instead of cloning CSS

The PNG renderer will import the maintained Editor header, vertical padding, row-height, tag-packing,
and card-width primitives. Shared Employee visual metrics will describe list padding, row padding,
avatar size, content gap, text line, and compact tag geometry. PNG row height and connection bounds
will be computed from these pure primitives rather than a second export-only layout.

This keeps rendering independent of mounted or virtualized DOM nodes and works for 4,000-Unit Views.
Cloning DOM into SVG `foreignObject` was rejected because it is browser-sensitive, captures only
mounted content, weakens large-output bounds, and conflicts with configurable output formatting.

### Center each Employee as one visual row

For each row the renderer will derive the complete content block height from the name line and
wrapped tag rows. The avatar is centered in the row, while the name and tag block is centered as one
column. All names and tags share one text origin after list padding, row padding, avatar width, and
the live 8 px gap. Every tag uses the live compact height, gap, padding, radius, font size, and the
same deterministic width estimator used to reserve DOM row height.

The existing Employee-format template remains the name-line content. Trimming remains bounded to
the available column; it does not move following rows.

### Mirror stable card identity without transient UI

The default PNG card will use the live 8 px radius, 72 px header, circular Unit icon surface, medium
title weight, summary placement, and conditional compact Live badge. Boss avatars retain the blue outer
ring and gain the same small blue role badge used on the canvas. Selection, hover, handles, context
controls, and drag targets remain excluded because they are transient editing chrome.

The canvas icon is drawn with local vector primitives. No SVG serialization, remote asset, or font
glyph is required. Output colors remain the stable light export palette so PNG appearance does not
depend on the current application theme.

### Compute layout once before painting

The renderer will build one immutable render-data entry per exported Unit containing ordered
Employees, row offsets/heights, card bounds, and summary/status labels. Painting and connector paths
consume those entries without remeasuring or mutating Editor state. Avatar loading remains bounded
and concurrent, and canvas pixel limits remain unchanged.

Browser coverage will decode the produced PNG and exercise a long, tagged roster with a boss and a
hierarchy. The screenshot preview remains the visual regression artifact.

## Risks / Trade-offs

- [Custom fonts can have different glyph widths from the live Inter font] → Use the same stable tag
  width estimator for layout and trimming; retain custom font choice only for painted glyphs.
- [More header and boss details increase paint work] → Use constant-cost vector primitives and keep
  one layout pass plus one paint pass.
- [Existing exported PNG dimensions change] → Treat the change as an intentional visual correction;
  state, settings, and file naming remain compatible.
- [Canvas antialiasing cannot be byte-identical to DOM rasterization] → Test structural geometry and
  visually review deterministic Chromium output rather than claim pixel identity.
- [A future Tailwind card change could drift again] → Keep numeric metrics in the shared Editor
  geometry module and cover expected DOM/export values together.
