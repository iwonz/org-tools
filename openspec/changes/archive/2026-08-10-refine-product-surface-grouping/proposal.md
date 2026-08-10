## Why

Several populated surfaces still rely on pane dividers, inconsistent tab treatments, and loose row
spacing, while Analytics lacks enough surface contrast to scan its groups comfortably. The affected
views need one coherent grouping language that stays compact without losing hierarchy.

## What Changes

- Remove the vertical separator between the Team tree and Employee list, and the corresponding
  separator between source and selected Employees in Download.
- Standardize every Radix tab group on one segmented switcher treatment: one shared boundary,
  contiguous triggers, and a flat selected segment without an underline.
- Remove inter-card gaps from virtualized Employee lists and render list cards as contiguous rows.
- Remove the Employees title beside search and place total and filtered counts below the search
  field, aligned to its left edge.
- Give each Analytics group a quiet card background and internal spacing while retaining borderless
  rows, content-sized sections, sorting, virtualization, and drill-down.
- Update browser assertions, documentation, and deterministic screenshots.
- Keep organization data, public state, import/export behavior, localization, and browser-only
  privacy boundaries unchanged.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `interface-chrome`: Standardize switchers, remove split-pane rules, compact Employee rows, and
  define bounded Analytics surfaces.

## Impact

Shared tab primitives, Teams, Employees, Download, Analytics, browser smoke tests, UI documentation,
and screenshot assets change. No dependency, persistence, network, state schema, or exported data
contract changes.
