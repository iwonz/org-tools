## Why

Calendar dialogs currently reserve space and render empty sections that do not help the user, while
an Org Editor Unit hover can wash out the card instead of providing clear feedback. The static
Pages runtime also needs an explicit regression boundary that keeps every MCP control absent.

## What Changes

- Omit the Birthday section from a Calendar day dialog when the selected day has no birthdays.
- Omit the Past section from a dated-tag dialog when the selected tag has no past events.
- Keep Org Editor Unit cards fully opaque and readable on hover in both themes.
- Strengthen static Pages validation so the MCP control cannot render in browser-only mode.
- Preserve the strict state contract, local-only privacy model, current MCP server behavior, and the
  43-screenshot gallery.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `dated-employee-tags`: Optional Calendar detail sections are rendered only when they contain data.
- `organization-editor`: Unit-card hover feedback remains opaque and readable.
- `mcp-agent-access`: The browser-only Pages runtime omits the MCP control across UI states.

## Impact

Calendar and Org Editor React presentation, Pages browser regressions, screenshots, documentation,
and the three affected capability specifications change. There are no API, dependency, persistence,
schema, Import/Export, or compatibility changes, and Pages remains memory-only with no MCP transport.
