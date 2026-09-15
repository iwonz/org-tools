## Context

The Editor stores every durable annotation in `structure.canvasElements`, resolves optional anchor
attachments into world geometry, and renders two fixed planes around the Unit-card plane. Current
ordering commands only reorder inside an existing plane. Sticker DOM and Canvas painters share a
folded-paper palette, while the draft textarea ignores vertical layout used by the resting renderer.
The property toolbar reserves complete rows for typography, geometry, and actions. Both Image export
dialogs regenerate bounded local PNG object URLs but display them as static images.

The change must preserve exact State parsing, View history, attachment geometry, the 20,000
Employee/4,000 Unit target, local-only rendering, and DOM/PNG parity.

## Goals / Non-Goals

**Goals:**

- Give Stickers one restrained flat DOM/PNG treatment and keep draft text visually stable.
- Keep one compact contextual row whose popovers expose alignment, geometry, and common actions.
- Make Front and Back meaningful across the Unit plane for every canvas-element kind.
- Provide the same bounded, accessible zoom and pan behavior in both PNG previews.

**Non-Goals:**

- Change the State schema, element defaults, anchor registry, attachment ownership, or hierarchy
  layer.
- Group attached elements for ordering, allow placement inside a Unit card, or persist preview
  viewport state.
- Change final PNG density choices, limits, composition, Copy, or Save behavior.

## Decisions

### Flat Sticker styling remains a shared primitive

Replace fold and sheen outputs in the shared Sticker color helper with a fill and a border mixed
12 percent toward near-black while retaining source alpha. DOM and Canvas painters use a four-pixel
radius and one-logical-pixel border with no gradient, fold, or shadow. Bounds, hit testing, anchors,
rotation, typography padding, and stored colors do not change.

### Draft layout derives from the same text measurement

Extract reusable text-block metrics from the existing line layout. Resting DOM, draft textarea,
auto-fit, and PNG consume the same wrapped content height and first vertical offset. The draft value
drives those metrics on every render, and an overflow-only transient rectangle height follows the
same integer normalization without writing the document. Commit writes text and the final expanded
height together once; alignment, focus, blur, and repeated editing never reset typography.

### The contextual surface uses progressive disclosure

Render one auto-width flex row without full-width property groups. Type-specific appearance controls
stay inline. One icon button opens a keyboard-accessible 3-by-3 horizontal/vertical alignment grid,
one geometry button opens labeled Width/Height/Rotation inputs, and one More popover contains Back,
Front, Duplicate, and Delete. Multi-selection exposes only applicable geometry and common actions.
Long localized labels live in accessible names and tooltips instead of constrained trigger text.

### Back and Front are cross-plane extremes

Narrow ordering to `back` and `front`. Back changes each selected element to `behindUnits` and moves
the selected block to the beginning of that plane; Front changes it to `aboveUnits` and moves the
block to the end. Existing array-relative order inside the selected block is retained. Only selected
elements change: attachments, offsets, endpoint controls, target elements, and dependents remain
unchanged. The complete update is one undoable command. Hierarchy connections keep their fixed base
position, and Unit cards plus Employee rows remain one indivisible plane.

### PNG previews share a transient viewport component

Create a browser-only preview viewport around each generated object URL. Its pure geometry functions
derive Fit (never above 100 percent), zoom around a pointer or viewport center, and constrained pan.
The lower scale is the smaller of Fit and 10 percent; the upper scale is 400 percent. At or below
Fit, the image is centered; above Fit, translation is clamped to keep the complete viewport covered
where possible and prevent losing the image. ResizeObserver recomputes bounds. Wheel zoom uses the
pointer, buttons use the center, primary-pointer drag pans, arrow keys pan, the percentage action
returns to 100 percent, and Fit restores containment.

Opening a dialog starts at Fit. Regenerated previews remain at Fit if the user has not navigated;
otherwise the normalized focal point and manual scale are preserved and clamped for the new image.
Viewport state, object URLs, loading, and failures stay transient. Remove visible render-plan copy
from both dialogs, but retain all plan calculations and raster limits in the painters.

## Risks / Trade-offs

- [Native textarea wrapping can diverge from measured lines] → Apply the measured content box,
  canonical font string, width, line height, and overflow height to the draft and cover all nine
  alignments in DOM/PNG tests.
- [Global Back can intentionally hide an annotation behind an opaque Unit] → Keep Undo available,
  expose the action consistently in More and context menus, and test overlapping Employee rows.
- [Wheel handling can trap dialog scrolling] → Prevent default only inside the focused preview
  surface and retain explicit controls and keyboard navigation.
- [Preview regeneration can cause jumps] → Preserve manual scale and normalized focal point; only
  automatic Fit tracks container and natural-size changes.
