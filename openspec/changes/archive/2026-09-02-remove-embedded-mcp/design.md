## Context

The local runtime currently combines the singleton Org Tools state with an optional embedded MCP
server. MCP owns a sidebar modal, three HTTP endpoints, an SDK, a domain-operation layer, bearer
credentials, three SQLite tables, external-revision events, three-way merge UI, an installable
skill, CI commands, and five screenshots. Pages already excludes MCP, but shared shell and isolation
checks still carry MCP-specific branches. The current ignored database has one valid
`application_state` row, a disabled stored token, and empty preview and change tables.

The product uses current-only schemas without version markers or compatibility readers. Historical
OpenSpec archives are an audit record and are not current product code.

## Goals / Non-Goals

**Goals:**

- Remove every active MCP route, control, credential, operation, dependency, test, skill, and
  documentation surface.
- Preserve the exact current organization and UI state while reducing the owned local database to
  one `application_state` table.
- Restore a single serialized persistence writer and identical sidebar behavior in server and Pages
  runtimes.
- Keep Import, Export, Download, strict state validation, automatic SQLite writes, live-tab
  synchronization, and the public `OrgToolsState` unchanged.

**Non-Goals:**

- Do not retain an MCP compatibility endpoint, tombstone route, token reader, or migration layer.
- Do not migrate arbitrary databases or support the removed four-table schema in application code.
- Do not rewrite historical OpenSpec archives or manually publish GitHub Pages.

## Decisions

### Delete the MCP slice rather than disable it

All MCP files, API routes, setup components, translations, screenshots, commands, and dependencies
are deleted. The shared shell no longer accepts a server-only footer slot. Keeping dormant code was
rejected because it would retain attack surface, credentials, bundle complexity, and maintenance
obligations despite having no user-facing entry point.

### Restore one unconditional serialized state writer

`PUT /api/state` accepts only the validated scoped update and atomically increments the stored
revision. The client no longer sends `expectedRevision`; the repository no longer emits revision
events; the controller no longer retains a merge base or offers external-writer conflict choices.
The existing single-flight queue and `BroadcastChannel` ordering remain responsible for normal UI
writes and tab convergence. This matches the product's non-collaborative deterministic
last-write-wins contract and removes machinery introduced solely for agent writes.

### Make the exact current SQLite schema one table

Fresh databases create only `application_state` with the current exact columns and no version
marker. Runtime initialization accepts only that exact shape and does not recognize the removed MCP
shape. For this owned environment only, implementation performs one explicit transaction against
the stopped ignored database to drop the three MCP tables after recording the state revision and
JSON hashes; the same values are verified afterward. This is delivery housekeeping, not a runtime
migration or compatibility path.

### Remove current capabilities but retain historical archives

The two MCP canonical capability directories are removed. MCP-specific requirements are removed
from the six affected shared capabilities, and the gallery contract returns to 38 frames. Archived
changes remain untouched so repository history stays auditable; active product files outside that
archive contain no MCP implementation or guidance.

## Risks / Trade-offs

- **Existing databases from an MCP-enabled build are no longer accepted automatically** → clean the
  owned local database in one verified transaction and document only the exact current schema.
- **Direct callers using `expectedRevision` break** → this API is private and loopback-only; update
  every repository caller and test atomically in the same change.
- **Removing optimistic merge can make simultaneous direct API writers last-write-wins** → the
  application has one serialized writer per tab and deterministic live-tab propagation; no external
  writer remains after MCP removal.
- **Deleting five screenshots can leave stale references** → derive documentation and public checks
  from the 38-entry manifest, regenerate twice, and verify every referenced PNG exists.

## Migration Plan

1. Stop the local runtime and capture the current `application_state` revision plus SHA-256 hashes
   of both JSON projections.
2. In one immediate SQLite transaction, drop `mcp_previews`, `mcp_changes`, and `mcp_settings`.
3. Re-read the database and require exactly `application_state` with identical revision and JSON
   hashes before using the new runtime.
4. Build and exercise the simplified runtime against isolated one-table databases and the cleaned
   owned database.

Rollback is the normal Git revert plus restoration of the removed metadata from external history;
the removed token and empty MCP journals are intentionally not backed up.

## Open Questions

None.
