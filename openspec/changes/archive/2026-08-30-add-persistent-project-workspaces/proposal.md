## Why

Org Tools currently discards every workspace on reload, forcing repeated JSON import and export for
ordinary local work. A local SQLite-backed project model can make work durable while preserving the
strict transfer document and keeping organization data on the user's machine.

## What Changes

- Add multiple named projects backed by one configurable local SQLite database, stable project URLs,
  sidebar project management, and automatic restoration of the last opened project.
- Add explicit workspace Save with dirty tracking, keyboard support, unsaved-navigation protection,
  optimistic revision conflicts, and separately auto-saved transient UI state.
- Keep JSON Import and Export scoped to the open project and preserve the current unversioned
  `OrgToolsState` transfer contract.
- Replace the browser-only privacy boundary with a loopback-only same-origin runtime boundary; data
  remains unavailable to third parties, remote services, browser storage, telemetry, and logging.
- Add a configurable ignored `.org-tools/org-tools.sqlite3` default, internal database migrations,
  local project APIs, project screenshots, and publication checks that reject tracked databases.
- **BREAKING**: replace the portable static export with a Node.js 22.13+ Next.js server bound to
  `127.0.0.1`; arbitrary static hosting is no longer supported.

Non-goals are collaboration, accounts, remote synchronization, normalized relational organization
tables, project metadata inside exported JSON, automatic transfer-file migration, and public or LAN
server exposure.

## Capabilities

### New Capabilities

- `project-workspaces`: Defines persistent project CRUD, stable links, SQLite storage, manual Save,
  UI persistence, revision conflicts, configuration, and recovery behavior.

### Modified Capabilities

- `workspace-state`: Changes startup and persistence from one blank in-memory workspace to the last
  local project while preserving the public JSON state contract.
- `privacy-safety`: Allows validated organization state to cross a loopback same-origin API boundary
  while continuing to prohibit external transmission and browser persistence.
- `interface-chrome`: Adds project management in the sidebar footer and explicit Save state in the
  workflow header.
- `project-tooling`: Replaces static build/start assumptions, adds database publication safeguards,
  and expands the complete screenshot catalog with project workflows.

## Impact

The Next.js runtime, routing, MobX lifecycle, localization catalogs, browser tests, screenshot
generator, build commands, CI, public-safety scanner, and contributor documentation change. The
implementation uses Node's built-in `node:sqlite` rather than a third-party database dependency and
raises the minimum Node.js version to 22.13. Existing JSON files remain compatible and can be
imported once into a new project; no existing local database requires migration.
