## Why

Editor Unit summaries currently spend space on zero counts, while Staffing Slots can be mixed below Employees by Tag grouping and are too visually subtle. This makes capacity and vacancy information slower to scan and creates avoidable DOM/PNG differences if corrected independently.

## What Changes

- Omit zero Employee and Staffing Slot fragments from Unit summaries and suppress a summary line when both values are zero.
- Keep the fixed Unit-header geometry while vertically centering the remaining zero, one, or two summary lines.
- Place every Staffing Slot before every Employee, including the boss, while retaining Tag-based ordering within the Slot block and the existing Employee ordering within the Employee block.
- Give Staffing Slot rows a shared translucent Rose surface in DOM and PNG while preserving their dashed outline and existing interaction states.
- Update deterministic Server/Pages coverage, documentation, and the maintained 56-frame gallery.

This change does not modify persistent State, exports, localization keys, privacy boundaries, or SQLite data.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `organization-editor`: Change Unit summary visibility, mixed-row ordering, and Staffing Slot DOM/PNG presentation.
- `project-tooling`: Require regression evidence and deterministic screenshots for the revised summaries and Slot styling.

## Impact

The change affects Editor row derivation, Unit-header rendering, both Editor image exports, related unit/browser tests, current documentation, and existing Editor screenshots. It adds no dependency, network behavior, or compatibility layer.
