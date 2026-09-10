## Why

Tag surfaces currently disagree about order, and the color picker cannot scroll reliably inside its catalog dialog. Users need one manually ordered catalog that also groups Editor Employees consistently in the canvas and PNG output.

## What Changes

- Restore bounded color-picker scrolling and hide zero dated-assignment counts; use the localized With date label.
- Reorder Tags with a drag handle or keyboard, persist one catalog order, and respect it in every Tag surface and output.
- Add per-Unit settings with a default-enabled Group by tag switch. Keep the boss first, assign each Employee to their earliest Tag, and alphabetize within contiguous groups without separators.
- **BREAKING**: require `OrgEditorUnit.groupByTag` in the current state contract. Convert the configured local database once outside runtime after backing it up; do not retain a legacy reader.
- Update all six locales, documentation, browser coverage, and the deterministic gallery.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `tag-catalog`: global manual order, accessible reordering, conditional dated counts, nested picker scrolling.
- `organization-editor`: per-Unit grouping settings and shared ordered row geometry.
- `employee-model`: preserve catalog order in Tag presentation and search results.
- `dated-employee-tags`: order Calendar Tag groups by the catalog.
- `data-export`: retain catalog order in Tag values and Editor image rows.
- `single-state-runtime`: persist grouping and perform the authorized one-time local conversion outside runtime.
- `state-transfer`: require the new Unit field in strict complete-state transfer.
- `project-tooling`: cover Tag ordering and Unit grouping in both runtimes and the 59-frame deterministic gallery.

## Impact

The global derived model, Editor ordering helpers, stores, state validator, shared Tag controls, Calendar, export pipeline, and synthetic fixtures change together. No dependency, remote service, telemetry, new storage surface, group headers, duplicate Employee rows, configurable alphabetic sorting, or migration framework is added. Existing state files without the new Unit field are rejected.
