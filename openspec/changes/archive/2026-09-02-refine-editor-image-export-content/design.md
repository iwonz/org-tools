## Context

The PNG renderer currently shares the live card's one-line tag-chip estimator. A chip width is
clamped to the Employee text column and the painter then calls an ellipsis helper, so an oversized
tag irreversibly loses visible characters. Employee row height is derived only from a count of
fixed-height chip rows, which cannot represent a multi-line chip. The same painter adds a blue Live
badge for dynamic Units; Static Units have no equivalent badge, and neither membership type belongs
in the requested image output.

The renderer is used by preview, clipboard copy, and download in both local-server and Pages
runtimes. It must stay deterministic, local, bounded, and independent of mounted DOM geometry.

## Goals / Non-Goals

**Goals:**

- Preserve every code point of every exported tag label and localized date without ellipsis.
- Wrap oversized content inside one neutral chip, then grow Employee rows, Unit bounds, and
  hierarchy anchors from the same immutable layout.
- Remove Unit membership-type labels from every PNG path.
- Compute tag layout once per included Employee with the selected, already-loaded export font.

**Non-Goals:**

- Changing tags, Unit membership, the live Editor canvas, text templates, or Data Download.
- Widening or repositioning persisted Unit geometry.
- Adding a font, image, layout, or network dependency.
- Changing state, persistence, APIs, SQLite, or MCP.

## Decisions

### Measure and retain one immutable tag layout per Employee

After the selected export font is ready, the renderer measures tag text on its local canvas. Each
layout records every chip's position, dimensions, and complete text lines. Ordinary chips continue
to pack horizontally with the current compact dimensions. A label wider than the available inner
width is greedily split at Unicode code-point boundaries into measured lines inside one full-width
chip. This guarantees progress even for an uninterrupted token and avoids an ellipsis or overflow.

The alternative of reducing the font would make long tags unreadable. Widening cards would change
the persisted hierarchy geometry, while rendering several independent chips would incorrectly make
one tag look like several tags.

### Derive row and connection geometry from actual tag-block height

The tag layout reports its exact block height and row count. Employee height grows from the existing
48-pixel baseline by only the tag-block height beyond one normal 12-pixel chip row. The shared visual
geometry accepts an explicit tag-block height for export while retaining the existing row-count path
for the live canvas. The same heights feed Unit bounds and connection anchors before painting, so a
wrapped tag cannot overlap a following Employee or detach a hierarchy line.

### Remove membership mode from the image painter contract

The renderer no longer accepts a localized Live label and does not reserve, measure, or paint a
membership badge. Unit title and Employee-count summary retain the full header width. Membership
rules and type remain unchanged in state and in the interactive Unit form.

## Risks / Trade-offs

- **Very long tags make exported cards taller** → Tag length is already state-bounded, layout is
  computed once, and existing canvas-pixel limits remain authoritative.
- **Proportional fonts produce different line breaks** → Layout and paint use the same loaded canvas
  font and measurement callback in one generation.
- **Unicode text can contain wide glyphs** → Every candidate line is measured; code-point iteration
  prevents UTF-16 surrogate halves and always advances.
- **Removing the badge frees header width** → Recompute summary width without a hidden badge offset
  and cover both static and dynamic Unit exports in tests.
