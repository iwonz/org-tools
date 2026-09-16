## Context

The Editor stores Text as one string plus one typography object and edits it through a textarea.
Its shared layout wraps only uniform typography, grows height only when content would clip, and lets
generic rectangle transforms set arbitrary Text height. PNG consumes that same uniform layout.
Layout direction and Arrange are separate controls even though both invoke the same store layout
commands. Font presentation was recently reduced to System and Georgia while the applications still
bundle several historical local families.

The State is strict and unversioned, both runtimes are local-only, and durable canvas presentation
must have matching live and PNG implementations. Rich selection formatting therefore has to remain
bounded, deterministic, cloneable, and safe for exact State parsing without importing HTML.

## Goals / Non-Goals

**Goals:**

- Make every layout-direction activation perform the appropriate full or selected arrangement.
- Give Text Miro-like automatic geometry, selection-aware inline formatting, and optional block or
  per-line fill while preserving attachments and one-command editing.
- Use one rich text layout for live content, draft content, geometry, anchors, and PNG.
- Expose five local font choices consistently in canvas and Image export.
- Load the immediately preceding plain Text shape without a corrupted-state failure and normalize it
  once into the new canonical shape.

**Non-Goals:**

- Add arbitrary HTML, links, lists, collaborative cursors, remote fonts, new export formats, or rich
  Sticker text.
- Change Unit, Employee, Arrow, Image, or Sticker persistence beyond shared font resolution.
- Add a global State version, background migration service, telemetry, or remote storage.

## Decisions

### Text keeps plain content with sparse canonical format runs

Keep `text` and base `typography`, and add `formatRuns`, `autoWidth`, `fillMode`, and `fillColor` to
Text only. Each run stores a complete inline family/size/weight/color style over a half-open UTF-16
range. Base typography fills gaps and continues to own alignment. Editing helpers split at
grapheme-safe selection boundaries, apply one property while preserving the others, discard empty
runs, and merge adjacent equivalent runs. This maps directly to DOM Selection without storing HTML
and keeps validation linear in text plus run count.

The parser recognizes exactly the previous Text key set or exactly the new key set. The former is
converted locally to fixed width, no runs, no fill, amber fill color, and top alignment. After local
fonts are ready, one non-history normalization derives its height while retaining its top edge or
attached source anchor; subsequent persistence writes only the new shape. Invalid ranges, styles,
ordering, overlap, grapheme splits, colors, or bounds reject the complete State atomically. This is
the narrow compatibility behavior explicitly required for the immediately preceding Text shape; no
general schema version or older shape chain is introduced.

### One fragment layout owns measurement and painting

Replace the uniform line model with a pure layout that resolves base style and format runs into
grapheme fragments, wraps them into visual lines, and returns positioned glyph fragments, line
bounds, maximum line heights, content bounds, and derived rectangle dimensions. Measurement is
injected so DOM canvas and export canvas use the same algorithm and resolved font strings.

Auto-width Text measures explicit paragraphs without wrapping until the maximum rectangle width;
fixed-width Text wraps within the stored width. The default and empty selectable minimum is 48 by
32 logical pixels. Height is always derived. Auto-width grows from the horizontal alignment edge;
fixed-width height grows from the top. Attachment compensation keeps the chosen source anchor at
its world point. New Text starts auto-width; any explicit width field or width drag changes it to
fixed-width.

Block fill paints one rounded rectangle over Text bounds. Lines fill paints one rounded strip per
non-empty visual line from its glyph bounds with four horizontal and two vertical logical pixels of
padding. Empty Text has no line fill but retains selectable bounds. Both paint before glyphs in DOM
and PNG.

### Rich editing is transient and plain-text only

Text uses a controlled contenteditable composed from styled spans. A draft holds text, canonical
runs, the last DOM range, and an optional pending caret style. Property pointer-down preserves the
DOM range. A non-empty range receives family, size, weight, or color; a collapsed range changes the
pending style for later input; a property action outside editing updates base and every affected run
for the whole element. Native paste is intercepted as text/plain and adopts the current caret style.
Alignment and fill remain element-level.

Composition is allowed to finish before canonical reconciliation. Canvas capture, blur, tool
change, and Escape all call one idempotent completion path. The complete editing session, including
text and inline properties, creates at most one history entry. Sticker retains its textarea and
3-by-3 alignment; Text exposes only horizontal alignment because derived height leaves no vertical
free space.

### Text transforms preserve derived height

Single Text frames omit top/bottom side targets and the Height field. Left/right and corner resize
targets alter only width and retain the opposite horizontal edge in local axes. Rotation still uses
the live derived center. A group transform applies horizontal scale to Text width and vertical scale
to its base and run font sizes, clamps them to supported bounds, then derives height. This preserves
the existing group gesture while ensuring Text height changes only through content, width, or font
size. Position, fallback geometry, and attachment offsets are updated in the same command.

### Fonts stay local and share one resolver

The current family set becomes System, Georgia, Bebas Neue, Lobster, and Montserrat. Both Next.js
applications import local Fontsource CSS for Bebas Neue and Lobster; Montserrat is already bundled.
Georgia and every named font use literal labels in all locales, while System remains localized.
Montserrat is now current, so an existing exact Montserrat value resolves to Montserrat; the other
historical families resolve to System and weight 500 resolves to 400. Bebas Neue and Lobster expose
their available regular face and allow the browser/canvas font matcher to synthesize weight 700.
Export waits for every unique base/run font request before laying out a scene. No font path or
catalog is fetched remotely.

### Existing store commands own arrangement and history

Remove the standalone Arrange button and invoke `applyLayoutToUnits(ids, mode)` for at least two
selected Units or `applyLayout(mode)` otherwise on every direction button press. The active button
is not disabled, so a repeated activation reruns layout. Existing store commands preserve snapping,
overlap avoidance, group center, selection, rollback, and one history/write boundary.

## Risks / Trade-offs

- [Contenteditable selection can be lost to toolbar focus] → Persist a logical range before property
  pointer-down and restore it after the action; cover mouse, keyboard, composition, and blur paths.
- [Many mixed runs increase wrapping cost] → Keep runs normalized, scan graphemes and runs once, and
  reuse one computed layout per element/render revision.
- [Single-weight display fonts differ when bold is synthesized] → Use the same CSS/canvas family and
  numeric weight request, wait for font readiness, and test live/PNG geometry in each runtime.
- [Compatibility normalization changes old excess Text height] → Preserve width, top edge, and
  attachments, make the normalization non-history and idempotent, and test a previous exact State.
- [Group scaling changes line breaks] → Apply font/width transforms first and derive final height once
  before committing the single group command.

