## Context

Single rectangular canvas elements are rendered around `x + width / 2` and `y + height / 2`, but
the generic group transform also rotates attachment offsets. After the preview is resolved against
its target anchor, an attached Text, Sticker, or Image can therefore orbit the target instead of
rotating in place. The Editor-wide keyboard handler currently supports history, clipboard,
selection-all, duplication, and deletion but has no Escape branch for a resting selection.

The change must retain one transient preview and one history commit per rotation, preserve durable
attachments, avoid state-schema changes, and behave identically in server and browser-only builds.

## Goals / Non-Goals

**Goals:**

- Keep the world-space center of one rectangular element exactly fixed throughout rotation,
  including when the element is attached.
- Derive that pivot directly from the element's current `x`, `y`, `width`, and `height` rather than
  from a surrounding selection or DOM box.
- Clear a resting canvas-element selection when Escape is pressed outside editable controls.
- Cover the geometry and keyboard behavior with focused unit and browser regressions.

**Non-Goals:**

- Changing group-rotation semantics, Arrow geometry, resize behavior, anchor types, state shape, or
  PNG rendering.
- Making Escape commit, undo, or delete persistent document data.

## Decisions

1. Add a pure single-rectangle rotation helper beside the existing canvas transform helpers. It
   clones the element, normalizes `element.rotation + delta`, and leaves dimensions and the center
   coordinates unchanged. Using the element fields directly makes the pivot independent of its
   rotated axis-aligned bounds and keeps the calculation shared and unit-testable.

2. When the rectangle is attached, calculate its source-anchor world point before and after the
   angle update and add that difference to the stored attachment offset. Resolving the attachment
   then reconstructs the same rectangle center while preserving the durable relationship. Detaching
   would be surprising and rotating the raw offset is the source of the current orbit.

3. Route a one-element rectangular rotate gesture through the new helper. Multi-element and Arrow
   rotation continue through the affine group transform, whose pivot remains the selected group
   bounds center.

4. Extend the existing Editor keyboard effect with a narrow Escape branch. It ignores editable
   targets and active pointer gestures, lets an open context menu consume Escape first, and clears
   selection only when at least one canvas element is selected. `clearSelection()` mutates only
   transient View UI state and creates no history or persistence write.

5. Add a unit regression that rotates a non-square attached rectangle from a non-zero angle and
   proves its center is unchanged after attachment resolution. Add server and Pages browser coverage
   that selects an element, presses Escape, and observes the selection frame and contextual controls
   disappear.

## Risks / Trade-offs

- [Risk] Floating-point anchor compensation can produce tiny decimal differences. → Compare centers
  with tolerances in tests and keep normalization in the existing helper.
- [Risk] Escape could close a menu and clear selection in one keypress. → Gate selection clearing on
  the render's open context-menu state and on the absence of an active drag.
- [Risk] Special-casing single rectangles could diverge from group transforms. → Keep only pivot and
  attachment preservation in the helper; reuse the existing rotation normalization and cloning.

## Migration Plan

No migration is required. Deploy the component and pure-helper changes together; rollback is the
single change commit because no persisted schema or exported representation changes.

## Open Questions

None.
