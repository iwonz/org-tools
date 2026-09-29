## Context

An expanded Unit without visible Employee or Staffing Slot rows renders one padded empty-state block. Manual Units render a 32-pixel Edit Unit action; Live Units render a shorter no-match message. The shared geometry still enforces the former 120-pixel minimum: the current 88-pixel header leaves only 32 pixels for both 16 pixels of vertical padding and the 32-pixel action, so the action overflows by 16 pixels. The same shared height drives hierarchy layout, spatial bounds, anchors, DOM cards, and PNG exports.

## Goals / Non-Goals

**Goals:**

- Reserve the complete empty-state block inside every expanded empty Unit.
- Keep collapsed, populated, Tag-footer, hierarchy, anchor, and PNG geometry derived from one helper.
- Preserve the existing action size, accessibility, and intentional external Unit controls.

**Non-Goals:**

- Changing State, persistence, Unit content, localization, or export settings.
- Drawing transient Edit Unit or Live no-match controls in PNG.
- Clipping the Unit fieldset or changing the size and style of empty-state content.

## Decisions

1. Define the expanded empty-state content height as 32 pixels and derive `ORG_EDITOR_UNIT_MIN_HEIGHT` from `ORG_EDITOR_UNIT_HEADER_HEIGHT + ORG_EDITOR_UNIT_VERTICAL_PADDING + empty-state height`. This restores the invariant that the shared Unit minimum contains its largest empty-state child and avoids another stale literal after header changes.
2. Keep `getOrgEditorUnitHeightForEmployeeRows` as the single geometry entry point. Empty expanded Units resolve to 136 pixels, populated Units continue to use measured row stacks, and empty collapsed Units return the 88-pixel collapsed height before applying the expanded minimum.
3. Continue adding the separately measured Tag-footer height after body geometry. DOM and PNG therefore receive the same outer bounds without duplicating placeholder calculations.
4. Do not add `overflow: hidden` to the Unit fieldset. Connection handles and the Add child Unit action intentionally extend beyond the card, so containment must come from correct geometry.
5. Verify containment by comparing DOM bounding boxes for the card and its manual or Live empty-state child. Verify Canvas parity through the shared height result and PNG render-plan evidence rather than introducing a second export calculation.

## Risks / Trade-offs

- [Expanded empty Units become 16 pixels taller] → This is the intended space already occupied by the overflowing action; hierarchy placement and connections consume the same corrected bounds.
- [A future empty-state control becomes taller than 32 pixels] → Keep the empty-state height as a named shared constant and assert its relationship to the minimum in tests.
- [Gallery frames shift because empty Units participate in layout] → Regenerate all maintained frames twice, compare hashes, and visually review the complete 56-frame gallery.
