## Why

Hovering an Org Editor Unit currently replaces its normal card background, making the Unit appear
washed out against the canvas. A passive pointer hover should not visually alter the complete card.

## What Changes

- Preserve the exact resting background color and opacity of an unselected Unit card on hover.
- Retain selection, drag/drop, keyboard focus, and explicit child/connection control feedback.
- Add light- and dark-theme browser regressions for stable Unit geometry and computed appearance.
- Preserve the public state contract, persistence, privacy boundary, and 43-screenshot gallery.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `organization-editor`: Unit-card pointer hover no longer changes the card background or opacity.

## Impact

The Org Editor Unit presentation, browser smoke assertions, usage documentation, and organization
editor capability spec change. There are no API, state, schema, dependency, Import/Export, MCP, or
compatibility changes, and no organization data leaves either runtime.
