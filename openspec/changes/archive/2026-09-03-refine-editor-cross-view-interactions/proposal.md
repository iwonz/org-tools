## Why

Editor interactions currently break down across View boundaries and during compound gestures: Tag summaries truncate content, copied Units cannot be pasted into another View, edge-bound drags stop at the visible canvas, and deleting nested selections can briefly produce invalid state and browser diagnostics. These issues make alternative organization layouts unreliable even though Views are intended to be safe, independent workspaces over the same Employee catalog.

## What Changes

- Render complete wrapping Tag summaries in Unit footers with one shared DOM and PNG layout whose measured height participates in Editor geometry.
- Move the transient Editor clipboard to the View collection so Copy and Paste work between Views without persisting or broadcasting clipboard data.
- Preserve internal Live dependencies when pasting and materialize source-only Live dependencies as static membership snapshots.
- Remove hover and native title tooltips from the View selector and lifecycle controls while preserving accessible labels and keyboard behavior.
- Add frame-coalesced edge-pan to Unit, Employee, connection, and marquee-selection drags with bounded quadratic speed and one final viewport commit.
- Route Unit deletion through one coordinator that removes descendant closures, materializes affected Live Units, prunes every stale UI and Download reference, and exposes only a valid final state to persistence.
- Update Editor interaction coverage, performance documentation, capability specifications, and the deterministic 52-image gallery without changing its scenario count.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `organization-editor`: complete Tag footer layout, edge-pan behavior, and valid atomic Unit deletion.
- `organization-views`: one shared session clipboard across Views with cross-View remapping and isolated target history.
- `project-tooling`: browser, performance, and deterministic screenshot validation for the refined interactions.

## Impact

- Affects the Editor layout/export helpers, View and Editor stores, gesture controller, Unit deletion coordinator, Editor toolbar, unit/browser tests, and screenshot fixtures.
- Organization data remains local-only. The shared clipboard is process-memory state for the current tab and never enters `OrgToolsState`, SQLite, `BroadcastChannel`, the system clipboard, or network traffic.
- `OrgToolsState`, the SQLite schema, state API, Import, and Export contracts are unchanged.
- No compatibility reader, migration, new dependency, external service, or GitHub Pages publication is introduced.
