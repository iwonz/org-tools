## Why

Editor Unit headers currently leave a large and inconsistent gap before Employee, Staffing Slot, or empty-state content because the fixed summary area centers one line differently from two lines and the body adds a second eight-pixel top inset. The Unit card needs one predictable eight-pixel rhythm that remains identical in DOM geometry and PNG output.

## What Changes

- Bottom-align zero, one, or two summary lines inside the existing 88-pixel header so the last visible line always ends at the same position.
- Remove the duplicated body top inset while preserving eight-pixel horizontal and bottom padding, 48-pixel row sizes, and four-pixel row gaps.
- Recalculate expanded Unit heights, row origins, virtualization, bounds, anchors, hierarchy layout, and both PNG exports from the shared compact geometry.
- Reduce an expanded empty Unit from 136 to 128 logical pixels while preserving its complete 32-pixel Manual action or Live message; keep an empty collapsed Unit at 88 pixels.
- Update the maintained browser and screenshot evidence without changing State, persistence, localization, privacy, or network behavior.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `organization-editor`: Define the shared eight-pixel Unit header-to-content gap, bottom-aligned summaries, and compact Unit geometry for DOM and PNG.
- `project-tooling`: Require deterministic Server, Pages, and screenshot validation for the revised Unit spacing.

## Impact

The change affects Editor Unit layout constants, DOM card structure, Canvas rendering coordinates, geometry tests, browser workflows, screenshots, and layout documentation. It changes no public type or State field, requires no SQLite conversion, adds no dependency, and preserves local-only processing.
