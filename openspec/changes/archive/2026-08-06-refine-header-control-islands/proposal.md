## Why

The header now groups product tabs, but its underline makes the active tab feel visually detached
from the group and the global actions still read as unrelated buttons. Both sides need consistent,
compact grouping while preserving the distinct semantics of navigation and actions.

## What Changes

- Replace the active product-tab underline with a flat, subtle selected-segment fill and stronger
  foreground color.
- Keep product tabs contiguous, borderless, and square inside their existing shared outer island.
- Group language, theme, Import, and Export into a second contiguous bordered island with equal
  height, shared surface treatment, no gaps, and no individual outer borders.
- Preserve responsive labels, keyboard behavior, accessible names, menus, and transfer workflows.
- Update browser assertions, screenshots, and interface documentation for both control islands.
- Keep all application data contracts and browser-only privacy behavior unchanged.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `interface-chrome`: Define the selected tab treatment and the shared global-action island.

## Impact

The unified header component, locale and theme triggers, browser smoke tests, interface-chrome
specification, usage documentation, and deterministic screenshots change. No dependencies, public
state fields, import/export formats, storage behavior, or network behavior change.
