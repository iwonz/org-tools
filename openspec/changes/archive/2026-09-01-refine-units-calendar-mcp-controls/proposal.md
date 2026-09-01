## Why

Several detail workflows still use redundant labels, uneven horizontal alignment, and text-only MCP
controls. These inconsistencies make the Units hierarchy, Calendar tag details, and MCP settings
feel less compact and less scannable than the surrounding product.

## What Changes

- Align the Units hierarchy directly below the shared header, align search and breadcrumbs with
  Employee avatars, remove the redundant direct-employee summary, and show the Employee count below
  search using the catalog pattern.
- Remove the redundant dated-tag event-count label from the Calendar tag dialog and render its
  Employees with the same complete row content and right-aligned actions as other Employee lists.
- Add thematic icons to MCP modal tabs and to the Enable and Disable actions while preserving
  accessible labels, button geometry, and the server-only MCP boundary.
- Update browser coverage, documentation, and the deterministic screenshot gallery for the refined
  surfaces.
- Preserve the public state contract, SQLite schema, state API, MCP protocol, privacy boundary, and
  Pages isolation.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `interface-chrome`: Define compact Units hierarchy alignment and icon-bearing MCP management
  controls.
- `organization-editor`: Define the Units Employee count placement and complete Calendar tag-dialog
  Employee rows.
- `mcp-agent-access`: Require thematic icons on MCP tabs and Enable/Disable actions without changing
  protocol behavior.

## Impact

The change affects Units and Calendar React surfaces, the server-only MCP settings modal, localized
UI composition, browser assertions, documentation, screenshots, and the corresponding canonical
capability specifications. It adds no dependency, network request, persistence field, migration, or
compatibility path and does not alter browser-only Pages behavior.
