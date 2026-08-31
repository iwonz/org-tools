## Why

The local database currently carries a schema version marker and compatibility branches for two
obsolete layouts, although Org Tools intentionally supports only current contracts. Removing that
machinery makes startup strict and predictable, and the MCP entry should use the concise product
name already used throughout the feature.

## What Changes

- **BREAKING**: accept only an empty database or the exact current SQLite table and column shape;
  reject every obsolete, incomplete, or unknown database without mutating it.
- Remove `PRAGMA user_version`, schema-version constants, legacy migration/reset paths, and their
  compatibility tests and documentation.
- Preserve ordinary reopen behavior for databases that already have the exact current schema and
  validate their singleton state before use.
- Rename the server-only sidebar action and dialog title from “Agent access” to “MCP”; show its icon
  in semantic green while MCP is enabled and remove the redundant Enabled badge.
- Replace environment-variable setup steps with ready-to-paste client configurations containing the
  current token, remove the provider-notice block, and remove the Examples tab.
- Keep the MCP protocol, token lifecycle, state revision, public `OrgToolsState`, Pages isolation,
  and current database tables unchanged.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `single-state-runtime`: require exact current-shape database initialization without schema
  versions, migration, reset, or backward-compatibility handling.
- `mcp-agent-access`: simplify the modal to setup/activity, embed the current token in client
  configuration, and remove redundant status and provider copy.
- `interface-chrome`: define the concise MCP label, enabled icon signal, and reduced modal structure.
- `project-tooling`: replace migration validation with strict current-shape rejection and require
  ready-to-paste token-bearing client setup in the maintained docs/gallery.

## Impact

The change affects SQLite initialization and repository tests, MCP navigation copy, localization
catalogs, browser/screenshot tests, architecture and usage documentation, and the deterministic PNG
gallery. Existing obsolete databases will fail visibly and remain untouched; users can explicitly
Import a current state into a new database if needed. Privacy and network boundaries do not change.
