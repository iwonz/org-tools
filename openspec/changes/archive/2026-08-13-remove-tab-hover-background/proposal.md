## Why

Tabs are navigation controls rather than buttons, but their current hover fill makes them look like
temporary button surfaces. Foreground-color feedback is sufficient and keeps the navigation calmer
and consistent with the color-only active state.

## What Changes

- Remove hover background fill from the shared tab trigger used by product and nested tabs.
- Keep hover foreground-color feedback, focus rings, active color, keyboard behavior, and disabled
  states unchanged.
- Add browser coverage that verifies transparent resting, hovered, and active tab backgrounds.
- Update interface documentation and deterministic screenshots.
- Keep workspace data, public file contracts, localization, privacy behavior, and non-tab controls
  unchanged.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `interface-chrome`: product and nested tabs retain a transparent background on hover and use only
  foreground color for pointer feedback.

## Impact

The change affects the shared Tabs primitive, interface browser assertions, capability text,
documentation, and screenshot output. It adds no dependencies, requests, persistence, or public
data-contract changes.
