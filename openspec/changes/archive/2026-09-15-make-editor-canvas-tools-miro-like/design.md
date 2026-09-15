## Context

The Editor currently renders eight visible rectangle resize handles, four detached-looking rotation
handles, and up to eight attachment markers inside the zoomed world layer. All affordances scale
with the View, rectangle resize calculations preserve pointer fractions, and text completion depends
on textarea blur even though canvas pointer handlers prevent default focus behavior. The durable
element geometry, anchor registry, two layer planes, undoable store commands, and shared DOM/PNG
scene already exist and must remain compatible.

## Goals / Non-Goals

**Goals:**

- Present one restrained, zoom-independent transform frame for a rectangle or element group.
- Keep every resize and rotation gesture discoverable while showing only four permanent corner dots.
- Persist whole-pixel rectangle dimensions without moving the fixed resize edge or rotation center.
- Make text completion and subsequent selection deterministic and idempotent.
- Remove plane switching from the UI without changing stored planes or render order.

**Non-Goals:**

- Changing the canvas-element State union, layer field, anchor-reference format, PNG composition, or
  schema validation rules.
- Quantizing positions, angles, Bezier geometry, or attachment offsets.
- Adding dependencies, remote assets, migrations, or compatibility readers.

## Decisions

### Separate transform semantics from visible chrome

The transform frame will retain eight resize directions and four rotation directions as semantic
buttons, but only the four corner resize buttons will be visible. Side buttons will be transparent
strips centered on the frame edges. Rotation buttons will be transparent zones immediately outside
each corner and use a bundled inline curved-arrow cursor, so pointer feedback distinguishes rotation
before a drag begins. The frame will be a one-screen-pixel solid signal outline. This keeps all-edge
behavior and accessible button labels without the visual noise of twelve permanent dots.

The transformed world layer will expose its viewport scale as a CSS custom property. Frame widths,
handle sizes, hit areas, and offsets will use its inverse so that they keep the same physical target
size across the supported zoom range. A single rectangle keeps its locally rotated frame; a group
uses its axis-aligned selected bounds.

### Reveal attachment affordances only when relevant

Rectangle anchor semantics stay unchanged. A selected rectangle will reveal compact side connector
handles only while its frame is hovered or keyboard-focused. Starting an attachment preserves the
chosen source anchor, and the existing spatial lookup will render only the nearest valid target
candidate during the drag. Existing corner or center attachments remain resolvable even though
their markers are not permanently painted.

### Quantize dimensions at geometry boundaries

A shared pure helper will clamp and round width and height to the permitted integer range. Resize
will calculate ideal local-axis bounds first, quantize the changed dimensions, and then reconstruct
the bounds from the unchanged opposite edge or corner. Locked Images will choose the nearest
integer pair derived from the requested dominant axis and intrinsic aspect ratio. Single-element,
group-transform, toolbar, and text-fit paths will all use the helper before producing previews or
commits. Group transforms will keep transformed centers and round each resulting rectangle size;
attachment offsets will be compensated through the existing anchor-delta path.

State validation will continue to accept finite fractional dimensions. Existing values will not be
rewritten on load; the property surface displays their rounded values and the next geometry edit
normalizes them. Positions, rotations, controls, and offsets remain continuous to avoid drift.

### Route text completion before canvas selection

The active draft identity and value will be mirrored in refs. One idempotent completion function
will consume those refs before validating and committing, so capture, blur, Escape, or tool changes
cannot create duplicate commands. Canvas pointer capture will finish a draft when the event target
is outside its textarea. Normal bubbling then clears selection for empty canvas, or replaces it for
another object. A toolbar blur finishes editing without clearing selection. Escape inside the
textarea finishes editing and retains the element selection; a later Escape follows the resting
selection handler.

### Keep planes as internal composition data

The toolbar plane Select and context-menu plane actions will be removed, along with now-unused
messages and callback plumbing. Element defaults, imported values, cloning, Copy/Paste, DOM and PNG
layer order, and Forward/Backward/Front/Back within the current plane remain unchanged.

## Risks / Trade-offs

- **[Risk] Invisible hit zones overlap at small element sizes.** → Use bounded screen-space zones,
  keep corner resize above side strips, and place rotation zones strictly outside the frame.
- **[Risk] Rounding a locked aspect ratio cannot preserve every irrational ratio exactly.** → Choose
  the nearest integer pair from the gesture's dominant dimension and keep the error below one pixel.
- **[Risk] Capture and blur both observe one outside pointer.** → Consume the draft ref before the
  store update and make later completion calls no-ops.
- **[Risk] Existing elements may retain fractional values indefinitely if untouched.** → Keep them
  valid for compatibility, show whole values in controls, and normalize only on explicit geometry
  edits rather than mutating a View during load.

## Migration Plan

No State migration is required. Rollback restores the former interaction chrome and controls while
all documents remain readable because the persistent schema and layer values do not change.

## Open Questions

None.
