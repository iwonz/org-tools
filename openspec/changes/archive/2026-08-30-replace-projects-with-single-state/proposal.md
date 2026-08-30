## Why

The two persistence models expose projects, files, Save state, autosave, and conflict recovery even
though Org Tools needs only one current organization state. This complexity also leaks persisted
English data such as `New project` into the Russian interface and leaves durable UI context outside
the exported state.

## What Changes

- **BREAKING** Replace the public state document with a strict current-only `{ organization, ui }`
  contract without `kind`, `content`, version fields, project metadata, or compatibility readers.
- Remove named projects, stable project URLs, browser file binding, File System Access, Save,
  Autosave, dirty state, and revision-conflict workflows.
- Persist one automatically updated state in SQLite for the loopback runtime and keep one
  tab-lifetime in-memory state in the static Pages runtime.
- Synchronize the latest state among same-origin browser tabs through `BroadcastChannel`; this is
  deterministic last-write-wins synchronization, not collaborative editing.
- Include all durable organization and UI context in Import, Export, SQLite, and tab synchronization
  while excluding transient overlays, notifications, and unfinished form drafts.
- Audit every English and Russian runtime surface and add automated catalog, placeholder,
  accessibility-copy, and fallback detection.
- Remove obsolete implementation, tests, documentation, dependencies, specifications, and ten
  project/file persistence screenshots.

Non-goals are remote collaboration, accounts, history, backups, browser snapshot persistence,
telemetry, and compatibility with previous state files or multi-project databases.

## Capabilities

### New Capabilities

- `single-state-runtime`: Defines the current state schema, singleton SQLite persistence, tab-lifetime
  Pages behavior, automatic writes, cross-tab convergence, and recovery.
- `state-transfer`: Defines strict atomic Import and direct Export of the one complete current state.

### Modified Capabilities

- `interface-chrome`: Removes persistence controls and Save feedback while making durable shell and
  workflow context part of the state.
- `interface-localization`: Requires complete catalog-backed copy and makes locale part of the
  synchronized durable state.
- `privacy-safety`: Replaces explicit browser-file persistence with memory-only Pages state and one
  loopback SQLite state.
- `project-tooling`: Updates builds, tests, screenshots, publication scans, and delivery rules for
  the singleton state model.

## Impact

The change replaces public types and fixtures, MobX state projections, both persistence
controllers, server routes and SQLite schema, browser tests, screenshot generation, and active
documentation. The obsolete `project-workspaces`, `browser-pages-workspace`, `workspace-state`, and
`workspace-transfer` capabilities are replaced rather than migrated. Existing multi-project
database contents and old exported JSON files are intentionally unsupported and are not converted.
