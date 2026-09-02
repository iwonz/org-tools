## Why

Org Tools no longer needs agent access, while the embedded MCP stack adds credentials, persistence,
API, conflict handling, dependencies, UI, documentation, and maintenance cost to an otherwise
single-state local application. Removing that complete surface restores one simpler trust boundary
and one writer model without changing organization data or explicit state transfer.

## What Changes

- **BREAKING** Remove the Streamable HTTP MCP endpoint, MCP control API, token lifecycle,
  Preview/Apply/Undo tools, activity journal, setup UI, and installable Agent Skill.
- **BREAKING** Replace the four-table managed SQLite shape with the current one-table singleton
  shape; the owned local database is reduced transactionally while preserving `application_state`.
- Remove optimistic MCP revision reconciliation, the state-events stream, conflict dialog, and
  `expectedRevision` from state writes while retaining serialized automatic persistence and
  monotonic response revisions.
- Remove MCP dependencies, commands, tests, translations, documentation, CI steps, screenshots, and
  current capability specifications.
- Keep `OrgToolsState`, Import, Export, Download, live-tab `BroadcastChannel` synchronization, and
  browser-only Pages behavior unchanged.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mcp-agent-access`: Remove the complete embedded MCP transport, agent contract, credentials, and management UI.
- `mcp-agent-skill`: Remove the distributable Org Tools Agent Skill and its behavioral contract.
- `interface-chrome`: Make the footer identical across runtimes and remove the MCP modal requirements.
- `interface-localization`: Remove MCP and MCP-conflict messages from the supported interface surface.
- `privacy-safety`: Remove the optional agent disclosure boundary and keep the browser/loopback state boundary.
- `organization-editor`: Remove agent-authored change and agent-operation requirements.
- `single-state-runtime`: Restore one-table SQLite persistence and one serialized UI writer without external-revision reconciliation.
- `project-tooling`: Remove MCP/skill validation and reduce the deterministic gallery from 43 to 38 product frames.

## Impact

The server loses `/mcp`, `/api/mcp`, `/api/mcp/undo`, and `/api/state/events`; `PUT /api/state` no
longer accepts `expectedRevision`. The `@modelcontextprotocol/server` and `zod` runtime dependencies,
MCP server modules, sidebar control, setup skill, dedicated tests, commands, and five MCP PNGs are
deleted. The ignored local SQLite file is cleaned in place without altering its organization or UI
JSON. Historical archived OpenSpec changes remain intact. GitHub Pages is rebuilt and verified but
is not manually published.
