## Why

The sidebar toggle currently uses a smaller 40 px square than compact navigation items, so its width
and inner icon spacing look inconsistent with the rail in both collapsed and expanded modes.

## What Changes

- Give the desktop sidebar toggle the same width and horizontal padding as a compact sidebar item in
  both sidebar modes.
- Keep the toggle icon on the same fixed horizontal axis as navigation icons during expansion and
  collapse.
- Update browser coverage and interface documentation for the shared geometry.
- Preserve current navigation, responsive behavior, focus feedback, and transient collapse state.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `interface-chrome`: Require the sidebar toggle to reuse compact navigation-item width and inline
  padding in both expanded and collapsed modes.

## Impact

The change affects sidebar button styling, shell browser assertions, interface documentation, and
the interface-chrome capability specification. It does not change organization data, public state,
imports, exports, browser storage, privacy behavior, dependencies, or network behavior. Changing
menu-item geometry or adding persistence is explicitly out of scope.
