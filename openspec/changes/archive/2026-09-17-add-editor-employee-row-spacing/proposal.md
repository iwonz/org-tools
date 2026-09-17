## Why

Employee and vacancy rows currently touch vertically inside expanded Editor Unit cards, which makes
individual people harder to scan. The row stack needs a compact internal rhythm without adding
empty space above the first row or below the last row.

## What Changes

- Add one deterministic four-logical-pixel gap between adjacent Employee/open-position rows in an
  expanded Unit while keeping the first row flush to the list start and the last row flush to the
  list end.
- Feed the same gap-aware offsets into Unit height, virtualization, hit testing, anchors, drag/drop,
  attachments, hierarchy layout, and full/scoped Editor PNG.
- Preserve row content, selection, distribution, open-position styling, collapse behavior, state,
  history, exports, localization, and the maintained large-Editor performance bounds.
- Update existing Editor screenshots and browser/unit coverage without adding a gallery scenario.
- Keep all processing local; no network, telemetry, storage, or SQLite migration is introduced.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `organization-editor`: Unit row stacks gain gap-aware DOM and PNG geometry with no outer row gap.
- `project-tooling`: automated and deterministic gallery checks cover the revised row geometry.

## Impact

The change affects shared Editor row-layout helpers, the Unit DOM renderer, the Editor PNG render
plan, geometry tests, Server/Pages browser coverage, documentation, capability specs, and existing
Editor screenshots. Persistent State, public types, localization catalogs, Employee counts,
attachments, and SQLite remain unchanged.
