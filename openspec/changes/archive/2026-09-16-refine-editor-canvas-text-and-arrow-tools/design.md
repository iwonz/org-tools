## Context

Text already persists grapheme-safe inline format runs, but its automatic mode grows toward the
global 20,000 px rectangle limit, wraps grapheme by grapheme, and lets the editable DOM perform a
different layout from resting DOM and PNG. Selection is sampled only from events delivered by the
contenteditable itself, so a pointer selection ending outside it or focus transfer into a Radix
control can leave the toolbar with a stale range. Sticker still uses a textarea and uniform
typography. Arrow controls are endpoint-local absolute vectors, so moving an endpoint or attached
target changes the curve disproportionately. Image inherits a geometry popover even though its
perimeter already supplies the intended transform interaction.

The State is strict and unversioned, every stable canvas presentation must match Editor PNG, and all
data, fonts, images, and generated output must stay in the browser or loopback runtime.

## Goals / Non-Goals

**Goals:**

- Give Text bounded word-aware automatic geometry and non-destructive uniform font fitting.
- Make selected-range and caret typography reliable for both Text and Sticker.
- Preserve cubic Arrow shape under endpoint and attachment movement.
- Replace ambiguous tool/marker controls and remove redundant Image geometry UI.
- Keep live, draft, anchor, history, State, and PNG behavior deterministic and local.

**Non-Goals:**

- Add HTML, links, lists, remote fonts, new Arrow marker shapes, orthogonal routing, or a new export
  format.
- Scale authored font values above their chosen sizes or mutate them as a side effect of fitting.
- Change Unit, Employee, JSON, Template, or general Employee export contracts.

## Decisions

### One rich layout derives automatic bounds and effective typography

Extend the current rich layout with word-aware break opportunities, a uniform `effectiveScale`, a
requested container size, and positioned fragments. Automatic Text measures tight content with a
48 by 32 floor and a 480 by 320 normal cap. It first uses authored sizes at scale 1. If height would
exceed 320, a bounded binary search finds the largest uniform scale that fits while no rendered
fragment falls below 8 px. If the 8 px floor still cannot fit, width stays 480 and height expands to
the measured content. Explicit newlines always break; whitespace creates preferred breaks; an
oversized token falls back to grapheme breaks.

Keep the persisted `autoWidth` key to avoid another Text schema. `true` now means automatic
two-dimensional fitting; `false` means the stored width and height form a manual frame. A manual
resize exposes every side and corner, reflows and fits without exceeding authored sizes, and clamps
height upward to the minimum content height at the 8 px floor rather than clipping. Auto and manual
geometry preserve the opposite resize edge, rotation center, and attachment source anchor. Fills
consume final layout geometry.

The layout receives an injected measurement function and returns already scaled typography and
line positions. Draft DOM, resting DOM, PNG, bounds, and fills consume those values rather than
independently wrapping. Font readiness runs before persistent normalization or export planning.

### Text and Sticker share a selection-aware draft

Add `formatRuns` to Sticker using the existing complete inline typography record and canonical run
rules. Generalize the transient draft/editor to Text and Sticker. Sticker remains a fixed-width,
vertically aligned surface at authored sizes; overflow grows its minimum height and does not use
Text's auto-fit scale.

While editing, a document `selectionchange` listener records ranges only when both endpoints belong
to the active editor, and window pointer-up captures a drag that ends outside it. Property-surface
pointer-down snapshots the logical range before focus moves. Formatting controls mark their focus
transition as part of the editing session, apply to that saved range or pending caret style, restore
the range, and avoid blur completion. IME, plain-text paste, Escape, canvas capture, and genuine
external blur share one idempotent commit path and one history entry.

Outside editing, Font, Size, Bold, or Color updates the base style and every run so the complete
element changes consistently. Text retains horizontal alignment; Sticker retains all nine
alignments. Copy, clone, View duplication, history, and synchronization deep-clone both kinds of
runs.

### Arrow endpoint edits use a normalized chord frame

Before an endpoint or attachment movement, convert both absolute cubic controls into coordinates in
the source chord frame: longitudinal and normal offsets divided by chord length. Rebuild the controls
in the target chord frame after the endpoint is moved or snapped. The opposite endpoint and its
attachment remain unchanged; the dragged endpoint detaches on free movement or receives the snapped
attachment. A source chord below the numerical epsilon falls back to controls one third along the
new chord. Manual control-handle edits remain freeform and establish the normalized shape for the
next endpoint change.

Attachment resolution applies the same source-to-resolved-frame projection without mutating State,
so target movement has the same DOM and PNG curve. Existing group affine transforms and persistent
endpoint/control fields remain valid.

### Controls use direct icon semantics

Use `TbLetterT` for Text and one local cubic path with one arrowhead for the Arrow tool. Because each
endpoint currently has only `none` and `arrow`, replace each Select with a pressed icon toggle; the
start icon points toward the start and the end icon toward the end. Keep localized accessible names
and remove only the unused option labels.

Do not render the geometry trigger or an empty contextual surface for an Image-only selection.
Perimeter resize/rotation, Shift aspect preservation, keyboard/context actions, and State remain
unchanged.

### Sticker compatibility is narrow and exact

The current Sticker shape requires `formatRuns`. The parser recognizes the immediately preceding
exact Sticker key set and normalizes it to `formatRuns: []`; a current Sticker requires valid
ordered, non-overlapping, grapheme-boundary runs. Invalid State is rejected atomically. Text retains
its current and already documented preceding normalization paths.

Before publication, inspect the configured owned SQLite snapshot with the runtime stopped. If it
contains preceding Stickers, retain a timestamped ignored database-family backup, convert a detached
candidate, validate fingerprints and the production parser, then update the singleton row in one
`BEGIN IMMEDIATE` transaction and reopen normally. No converter or database artifact is committed.

## Risks / Trade-offs

- [Contenteditable selection can cross generated line nodes] → Map DOM points through explicit
  fragment range metadata and cover reversed, outside-pointer, toolbar, and IME flows in browsers.
- [Font fitting can become expensive while typing] → Measure graphemes once per draft revision,
  binary-search a bounded number of scales, and coalesce draft rendering with the existing React
  update boundary.
- [An authored 8 px fragment prevents further uniform reduction] → Preserve proportions and grow the
  exceptional height rather than clipping or changing author intent.
- [Attachment movement has no durable endpoint commit] → Derive normalized controls from stored
  fallback geometry during resolution so rendering stays pure and deterministic.
- [Previous Sticker State lacks runs] → Accept only that exact predecessor and verify owned SQLite
  offline before publication.
