## Why

Editor actions currently float directly over the neutral canvas, so their grouping is unclear until
individual controls are hovered. At the same time, active tabs change both color and font weight,
while color alone is sufficient and produces a calmer navigation state.

## What Changes

- Place the Editor's top-left action group and bottom-left viewport group on compact adaptive
  background surfaces so each set reads as one toolbar over the canvas.
- Keep the controls themselves borderless and preserve the existing layout, search expansion,
  keyboard behavior, and responsive containment.
- Make active product and nested tabs differ by foreground color without changing font weight.
- Update browser assertions, documentation, and deterministic screenshots for both themes.
- Keep workspace data, import/export contracts, localization keys, privacy behavior, and all
  non-Editor workflow surfaces unchanged.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `organization-editor`: Editor control groups become compact toolbar surfaces over the canvas.
- `interface-chrome`: active tabs use color without a font-weight change, and Editor toolbar
  surfaces become an explicit semantic exception to the flat workflow policy.

## Impact

The change affects shared tab styling, Editor toolbar wrappers, browser visual assertions,
screenshots, and interface documentation. It adds no dependencies, network behavior, persistence,
or public data-contract changes.
