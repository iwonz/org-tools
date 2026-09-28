## Context

Unit summaries are currently assembled independently in the Editor and two image-export dialogs, so all three always include Employee and Staffing Slot zero counts. Mixed rows are sorted through one comparator, which allows tagged Slots to appear among Employees and always pins the boss above Slots. The DOM draws only a dashed Slot outline while Canvas repeats the outline with no fill.

The fixed 88-pixel Unit header, shared row layout, virtualization, anchors, and DOM/PNG geometry are current invariants. Persistent State is unaffected.

## Goals / Non-Goals

**Goals:**

- Produce one localized zero-filtering summary model for DOM and Canvas.
- Keep Slots in a first block while preserving Tag ordering inside that block and current Employee ordering inside the second block.
- Draw one exact Rose surface in DOM and Canvas without changing row geometry or interaction semantics.
- Preserve bounded derivation for 20,000 Employees and 4,000 Units.

**Non-Goals:**

- No configurable Slot color, State field, schema migration, or new localization key.
- No change to Staffing Slot counting, Tags, drag/drop, selection, or Employee projections.

## Decisions

### A shared summary formatter returns zero, one, or two complete strings

A pure formatter will accept an `OrgEditorUnitSummary`, localized count callbacks, and the existing Total/In Unit labels. It omits each zero fragment, joins remaining fragments with ` · `, and omits a labeled line when both counts are zero. DOM and both export dialogs will consume its result. The fixed header remains 88 pixels; CSS and Canvas center a single surviving line in the existing summary area.

### Row derivation uses two independently sorted blocks

`getOrgEditorOrderedUnitRows` will sort Slots by active Tag rank, normalized name, and stable ID, then append Employees in their existing boss/Tag/name/ID order. With Tag grouping disabled, Slot order falls back to name and ID. The uncached row-layout fallback will also put name/ID-sorted Slots before Employee IDs so first render, hit testing, and anchors never expose the old block order.

### One source Rose fill is shared by DOM and Canvas

The source fill is `rgba(244, 63, 94, 0.15)` and the DOM hover fill is `rgba(244, 63, 94, 0.20)`. Shared constants feed CSS variables for the DOM and Canvas fill operations. Selection keeps the existing primary surface and takes precedence. Canvas paints the resting fill before the existing dashed outline, avatar, text, and Tags.

## Risks / Trade-offs

- **A one-line parent summary can expose vertical drift between DOM and Canvas** → calculate both from the same returned line count and retain the fixed summary-area bounds.
- **Separating row blocks can invalidate cached offsets** → derive and cache the final combined order once, then pass that exact order to virtualization and export layout.
- **A translucent fill can disappear behind interaction colors** → explicitly give selected state precedence and test resting, hover, and selected DOM styles plus resting PNG pixels.

## Migration Plan

No migration is required because the exact State shape and stored values do not change. Deployment and rollback are ordinary code changes.

## Open Questions

None.
