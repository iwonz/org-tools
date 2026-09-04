## Why

Distribution analysis is currently efficient for one Unit at a time, but large selections still
require repetitive context-menu work and Employees assigned across Units are difficult to inspect
or locate. Tag-heavy organizations also need searchable, consistently sorted filters and denser Tag
catalog metadata.

## What Changes

- Make the Editor distribution-mode switch operate on one or many selected Units with an accessible
  mixed state and one bounded UI update.
- Show a multi-Unit placement action on eligible Editor Employee rows and open a read-only local
  relationship canvas that can navigate to the exact Employee occurrence in the active View.
- Add virtualized Tag search, locale-aware ordering, and search-scoped Select all/Deselect all to
  every shared Employee filter.
- Keep Tag catalog counts inline immediately after the colored Tag surface.
- Add complete six-locale copy, browser coverage, performance assertions, and two supporting gallery
  frames without changing the public state, SQLite schema, or network surface.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `editor-distribution-mode`: distribution mode supports selected Unit sets and Employee placement
  inspection and navigation.
- `organization-editor`: Editor Employee rows expose a read-only placement graph and exact canvas
  navigation without affecting interaction geometry.
- `employee-model`: shared Tag filters provide searchable locale-aware options and search-scoped bulk
  selection.
- `tag-catalog`: Tag ordering is locale-aware and catalog counters remain inline with each Tag.
- `interface-localization`: all new visible and accessible distribution and Tag-search copy exists in
  every bundled locale.
- `project-tooling`: browser, performance, and deterministic gallery coverage expands to 58 frames.

## Impact

The change affects the shared Employee search controls, Tag catalog dialog, Editor distribution
derivations and row composition, localized message catalogs, browser/unit tests, documentation, and
the deterministic screenshot manifest. The placement graph is derived locally from the active View;
it is transient, read-only, excluded from reports, and creates no external request. Existing state
files remain valid because no persisted contract changes.
