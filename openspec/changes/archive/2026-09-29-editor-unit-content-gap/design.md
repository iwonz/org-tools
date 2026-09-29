## Context

An Editor Unit uses an 88-pixel header with a 32-pixel title row, a fixed summary row, and eight-pixel outer padding. The Employee and Staffing Slot body then adds another eight-pixel top inset. Summary lines are centered inside their fixed area, so a one-line summary ends eight pixels higher than a two-line summary. DOM rows, virtualization, spatial bounds, anchors, hierarchy placement, and Canvas export all derive from the same row-origin and Unit-height constants.

## Goals / Non-Goals

**Goals:**

- Make the final visible summary line end at one stable coordinate for zero, one, or two summary lines.
- Leave one eight-pixel interval before Employee, Staffing Slot, or empty-state content.
- Keep row sizes, row gaps, header size, external controls, Tag footer behavior, and DOM/PNG geometry synchronized.
- Preserve bounded constant-time geometry derivation for large Views.

**Non-Goals:**

- No State, persistence, SQLite, localization, filtering, ordering, or interaction changes.
- No change to Employee, Staffing Slot, Tag-chip, summary text, or external connection-control styling.

## Decisions

### The header owns the complete inter-block gap

The existing eight-pixel bottom padding of the 88-pixel header will be the sole gap before body content. The body list keeps eight-pixel horizontal and bottom padding but its top padding becomes zero. This avoids stacked padding while retaining the existing card rhythm and complete empty-state containment. A four-pixel gap was considered but rejected because the accepted product decision is the standard eight-pixel content inset.

### Summary content is bottom-aligned inside its fixed area

The DOM summary grid will align its lines to the end of the existing 34-pixel row. Canvas will derive summary baselines from the same bottom edge, so the final line has the same position for one-line and two-line summaries. The header remains 88 pixels and no dynamic header measurement is introduced.

### Shared geometry represents top and bottom body padding separately

The row origin will use a zero-pixel list top inset. The total body vertical padding will be derived from zero-pixel top plus eight-pixel bottom padding. Expanded empty Units therefore become 128 pixels and a Unit with one 48-pixel row becomes 144 pixels. Empty collapsed Units stay 88 pixels; collapsed Units that expose the boss row use the same body geometry. The existing row-height helper continues to feed DOM, hierarchy layout, virtualization, hit testing, anchors, and both PNG render plans.

### Tag footers remain a separate measured block

The Tag footer height continues to be added after the body height. Its own padding, chips, wrapping, and rendering do not change. This preserves the current footer surface while moving its top edge upward by the same eight pixels as the compact body.

## Risks / Trade-offs

- [Existing tests and specs encode the previous 136-pixel empty height] → update exact geometry assertions and the canonical requirement through the delta spec.
- [DOM and Canvas summary lines could drift] → test the last summary-line coordinate for both one and two lines and compare row origins in both renderers.
- [Compact heights move connections and attached canvas elements] → exercise hierarchy spacing, anchors, bounds, scoped export, and full-View export in both runtimes.

## Migration Plan

No migration is required because State and stored values are unchanged. Deployment and rollback are ordinary code revisions; existing Views immediately render with the compact derived geometry.

## Open Questions

None.
