## Why

The Editor currently uses a translucent selected-Team fill and performs document-wide reactive work
during pointer gestures, which makes selection look inconsistent and canvas interaction degrade as
the organization grows. Primary workflow actions are also split between internal panels instead of
the shared context header, while several small control and spacing details remain inconsistent.

## What Changes

- Keep selected Editor Team cards opaque and identify selection only through the existing semantic
  boundary.
- Restore the shared styled View selector, normalize Editor command typography and icon placement,
  and make Editor search transient when closed.
- Render pan, zoom, and Team drag previews through a frame-coalesced transient interaction layer,
  use indexed viewport queries, and commit document or viewport state only when the gesture ends.
- Add one responsive contextual action to the application header for Teams, Employees, and Data
  Download, removing duplicate actions from workflow panels and empty states.
- Normalize Calendar dated-tag count spacing and verify that MCP starts disabled only for a fresh
  database while preserving an explicit enabled setting across restarts.
- Update browser coverage, performance assertions, documentation, specifications, and the existing
  43-frame deterministic screenshot gallery.

The strict `OrgToolsState`, SQLite shape, state API, MCP protocol, privacy boundary, and Pages MCP
isolation do not change.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `interface-chrome`: Add responsive contextual header actions and define their icon and duplicate-action behavior.
- `organization-editor`: Define opaque Team selection, styled View selection, transient search, frame-coalesced gestures, indexed culling, and Calendar count spacing.
- `mcp-agent-access`: Clarify fresh-database disabled state and persistence of an explicit enable decision.
- `project-tooling`: Correct the maintained screenshot gallery count and extend browser/performance validation.

## Impact

The change affects the shared application shell, Teams, Employees, Editor, Calendar, and Data
Download components; Editor interaction utilities and tests; localized message usage; canonical
documentation and specs; and deterministic screenshots. It adds no dependency, external request,
public API, persistence schema, or state compatibility behavior.
