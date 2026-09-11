## Why

Unit display preferences belong to a View so every card can use one consistent presentation.
Distribution colors should be configurable alongside those preferences without changing membership.

## What Changes

- Replace Unit settings with an accessible View settings dialog containing grouping, Tag cloud visibility, and two distribution colors.
- Share grouping and footer visibility across canvas geometry and PNG; apply distribution colors to Editor rows, paths, and markers.
- **BREAKING**: replace Unit `groupByTag` with required View `structure.settings`, including View-local history and complete state transfer.
- Convert the configured local database once with a backup and transactional validation; do not add runtime compatibility or migration.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `organization-editor`: View settings replace Unit controls and govern shared rendering.
- `organization-views`: Settings are isolated, copied, persisted, and undoable per View.
- `editor-distribution-mode`: View colors replace fixed status colors.
- `data-export`: PNG follows source View grouping and Tag cloud visibility.
- `state-transfer`: Require exact View settings in complete state and reject obsolete Unit grouping.
- `single-state-runtime`: Preserve View settings through local persistence, safe conversion, and startup ordering.
- `project-tooling`: Document and verify View settings, strict state conversion, and gallery coverage.

## Impact

Types, strict state validation, editor history, View lifecycle, shared color selection, canvas/PNG
geometry, fixtures, six locales, documentation, and browser checks change. No new dependency or
network boundary is introduced. Membership, Tag catalog order, report data, and per-Unit distribution
activation are unchanged. Old state files are rejected; only the current configured SQLite state
receives the explicitly authorized offline conversion.
