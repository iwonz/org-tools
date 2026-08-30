## Context

Org Tools currently has one MobX product model behind two persistence controllers. The loopback
runtime stores multiple revisioned SQLite projects and the Pages runtime binds an optional local
file. Both expose explicit Save and optional Autosave. The product now requires one automatically
updated state, tab synchronization, a current-only transfer schema, and complete English/Russian UI
coverage while preserving the 20,000 Employee and 4,000 Unit target.

## Goals / Non-Goals

**Goals:**

- Make one validated `OrgToolsState` the source of truth in both runtimes.
- Persist it automatically to one SQLite row in server mode and only in live page memory in Pages.
- Synchronize live same-origin tabs without persisting organization snapshots in browser storage.
- Keep large organization serialization out of bounded UI-only updates.
- Remove project, file binding, Save, Autosave, dirty, and compatibility code completely.
- Guarantee that every runtime string is catalog-backed and available in English and Russian.

**Non-Goals:**

- Collaborative editing, semantic merging, accounts, remote access, Yjs, history, or backups.
- Offline browser persistence, File System Access, or migration of an old database or JSON file.
- Persisting open overlays, toast notifications, or unfinished form drafts.

## Decisions

### One current-only state with organization and durable UI slices

The public document has exactly two top-level keys: `organization` and `ui`. Organization contains
the Employee catalog and View documents. A View document contains structural editor data but not
viewport or selection. Durable UI contains locale, theme, sidebar mode, active navigation and View,
Unit expansion and selection, per-View viewport and selection, and typed durable state for filters,
search, Calendar, Analytics, and Download. The parser requires exact keys and sanitizes references
only after the complete document has passed structural validation.

This split lets SQLite and cross-tab transport update the bounded UI projection without walking the
Employee catalog. Keeping the former discriminator or a compatibility reader was rejected because
the product explicitly uses a current-only contract.

### One runtime controller with two adapters

Shared React code consumes a state-runtime interface rather than project or browser-file
controllers. The Pages adapter starts with a blank state, participates in a `BroadcastChannel`
handshake, and never writes organization or durable UI snapshots to browser storage. Locale and
theme remain permitted bootstrap metadata; after hydration the state is authoritative.

The SQLite adapter loads `/api/state` and writes scoped changes. It uses a single-flight queue per
scope: discrete actions enqueue immediately, pointer streams commit on gesture completion, and text
streams commit after 300 ms idle or blur. When a request is active, only the latest pending value is
retained. Failure keeps memory intact, retries with a bounded delay, exposes one localized Retry
action, and enables unload protection until the latest snapshot is durable.

### Deterministic tab synchronization, not collaboration

Messages use one fixed channel name and an envelope containing `originId`, logical counter, scope,
and validated payload. Tabs ignore their own messages and already applied stamps. A new tab requests
state; responders return their latest complete validated snapshot, and the highest deterministic
stamp wins. Concurrent independent actions use deterministic last-write-wins because semantic
merging is explicitly out of scope. Server responses add the authoritative monotonic SQLite
revision and are rebroadcast so tabs converge on write order.

### Singleton SQLite and scoped API

SQLite contains one singleton row with `organization_json`, `ui_json`, `revision`, `created_at`, and
`updated_at`. The current database path precedence and rollback-journal durability settings remain.
`GET /api/state` returns the assembled state and revision. `PUT /api/state` accepts a discriminated
`organization`, `ui`, or `all` update, validates it before a transaction, increments revision once,
and returns the accepted revision. Responses are no-store; mutations remain JSON-only,
same-origin, and loopback-only.

Startup recognizes the exact obsolete `projects`/`app_state` table signature, drops those managed
tables, and creates the singleton current schema without reading or converting rows. Unknown schema
shapes and corrupt current JSON are blocking errors and are never silently reset.

### Localization is validated at source and at runtime

English and Russian catalogs have identical non-empty keys and placeholder sets. UI components use
typed catalog access for visible text, titles, placeholders, accessibility names, and errors.
Server errors expose stable codes; clients never render their raw messages. Static checks reject
user-facing literals and unexpected Russian/English catalog fallbacks, with a small explicit
allowlist for product name, format acronyms, filenames, and user content. Browser coverage switches
locale and opens menus, dialogs, empty states, and error states in both runtimes.

## Risks / Trade-offs

- **Last-write-wins can discard truly simultaneous tab edits** → The UI documents this as tab
  synchronization rather than collaboration; deterministic stamps and server revisions guarantee
  convergence.
- **Automatic full organization writes can be expensive** → Structural snapshots occur only at
  logical action boundaries; high-frequency UI state uses the bounded UI slice.
- **A Pages reload after the final tab closes loses state** → Import and Export remain explicit, and
  browser snapshot persistence is intentionally forbidden.
- **The breaking schema discards old data** → Old JSON is rejected clearly and the recognized old
  SQLite schema is reset once; no ambiguous partial conversion is attempted.
- **Making more UI state durable expands validation work** → Each module owns a bounded typed slice,
  defaults, exact parser, and dangling-reference sanitizer.

## Migration Plan

1. Replace public types, parsers, fixtures, and stores with the new split state.
2. Add the singleton repository/API and shared cross-tab runtime, then switch both app entry points.
3. Remove project routes, project/file controllers, Save/autosave components, storage helpers, and
   obsolete dependencies.
4. Replace active documentation, specs, tests, and screenshots; remove obsolete generated files.
5. Run the complete repository lifecycle. Rollback is the parent Git commit; there is no data-level
   rollback or compatibility path.

## Open Questions

None. The approved plan fixes schema compatibility, state scope, write boundaries, tab conflict
semantics, and publication scope.
