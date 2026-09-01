## Why

The interface still has two inconsistent control families whose thematic icons trail their labels,
while the rest of the product uses leading icons. The selected Unit roster also inserts a redundant
descendant-Employee section heading even though one total and filtered count already describes the
complete list below search.

## What Changes

- Require thematic icons to precede visible labels in text buttons and tabs, while preserving
  conventional trailing disclosure, sort, removal, badge, and count affordances.
- Move contextual header-action and Editor layout-command icons before their labels without changing
  responsive icon-only behavior, accessibility, geometry, or interaction states.
- Render direct and descendant Employees as one contiguous virtualized selected-Unit roster and
  remove the redundant descendant section heading and its count.
- Remove the obsolete Employee-list section API and translation entry after its final consumer is
  removed.
- Refresh the complete deterministic screenshot gallery and documentation, then publish the merged
  browser-only application through the existing guarded GitHub Pages workflow.
- Preserve the current state contract, SQLite shape, HTTP and MCP interfaces, privacy boundary, and
  browser-only Pages isolation.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `interface-chrome`: Standardize leading thematic icons and remove redundant selected-Unit roster
  section chrome.
- `organization-editor`: Put Editor command icons first and present selected-Unit Employees as one
  contiguous virtualized list with one summary count.

## Impact

The change affects shared shell and Editor control composition, selected-Unit roster rendering,
localized message catalogs, browser assertions, screenshots, documentation, and the two modified
capability specs. No public data shape, dependency, server route, persistence behavior, or remote
data flow changes.
