## Why

Although the product panels themselves already begin below the unified header, their first controls
still add different top padding. Switching from the flush Editor canvas to Teams, Employees,
Analytics, Calendar, or Download therefore makes the visible content jump downward by varying
amounts.

## What Changes

- Remove root-level top padding from the first populated content group in every non-Editor product
  tab.
- Align the leading Teams controls, Employee search, Analytics header, Calendar header, and Download
  source/selection controls directly with the bottom edge of the application header.
- Retain horizontal and bottom spacing, internal spacing below the leading group, responsive
  behavior, and the Editor canvas treatment.
- Preserve empty-state centering, all workflows, state, imports, exports, and public contracts.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `interface-chrome`: require the first visible root-level content group in every populated product
  tab to start without top margin or padding.

## Impact

The change affects top-level spacing classes in Teams, Employees, Analytics, Calendar, and Download,
plus browser geometry assertions, screenshots, and interface documentation. It adds no dependency,
network behavior, persistence, or compatibility change.
