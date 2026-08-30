# Architecture

Org Tools has two deliveries over the same React, MobX, and strict `OrgToolsState` implementation.

- `apps/ui` is a local Next.js server bound to `127.0.0.1`. It renders the application and exposes
  the same-origin singleton state API backed by SQLite.
- `apps/pages` is a static Next.js export at `/org-tools`. It imports browser-safe UI only and keeps
  organization state in the memory of currently open tabs.
- `packages/types` defines the state, Employee, Unit, View, editor, and output contracts.
- `packages/screenshots` contains production browser checks, the shared strict browser-diagnostic
  collector, and the deterministic gallery.

## State contract

The public JSON value has exactly two top-level properties:

```ts
type OrgToolsState = {
  organization: {
    employees: OrganizationEmployee[];
    views: OrgToolsViewDocument[];
  };
  ui: OrgToolsUiState;
};
```

There is no kind, content discriminator, version, compatibility alias, or partial transfer scope.
View documents contain structural editor data. Viewport and selection live in the bounded `ui.views`
projection so ordinary interface writes do not serialize the Employee catalog or Unit graph. The UI
projection also contains locale, theme, sidebar mode, active section and View, filters, searches,
calendar period, Analytics settings, and Data Download settings. Open surfaces, notifications, and
unfinished forms are transient.

Import parses one detached value, validates exact keys, identifiers, dates, URLs, embedded avatars,
references, graph invariants, and UI references, then performs one atomic store replacement. Export
validates and downloads the current live value as `org-tools-state.json`. Old JSON shapes and
arbitrary JSON are rejected.

## Local SQLite runtime

`/` renders the application directly. `GET /api/state` returns `{ revision, state }` and
`PUT /api/state` accepts exact `organization`, `ui`, or `all` scoped updates. Every response uses
`Cache-Control: no-store`. Mutations require JSON, a loopback Host, and a matching same-origin
Origin. CORS is not enabled.

SQLite schema v1 contains one strict `application_state` row with `organization_json`, `ui_json`,
revision, and timestamps. The repository uses prepared statements, immediate transactions,
rollback journal mode, `foreign_keys=ON`, `synchronous=FULL`, and a busy timeout. An exact obsolete
`projects` plus `app_state` schema is destructively replaced on first open without data migration;
unknown schemas and corrupt current rows are blocked rather than silently reset.

The database path resolves in this order:

1. `ORG_TOOLS_DB_PATH`;
2. `.org-tools/config.json` with one non-empty `databasePath` string;
3. `.org-tools/org-tools.sqlite3`.

Relative paths resolve from the repository root. The connection is lazy and shared across
development hot reloads. Invalid configuration never falls back to ephemeral storage.

Organization actions enqueue an immediate full-state write. Durable UI changes use a 300 ms trailing
delay and a scoped UI write. The single-flight writer permits one active transaction, replaces an
older queued snapshot with the latest one, retries failures with a bounded backoff, and retains an
in-memory warning plus `beforeunload` protection until recovery. There is no Save button, dirty UI,
revision conflict dialog, or user-controlled autosave.

## Static runtime and tab synchronization

The static runtime never imports server modules or references `/api/state`. A new tab requests the
latest state over the same-origin `BroadcastChannel`. A live tab answers with the current validated
state; if no tab answers, the new tab starts empty. Closing the final tab destroys organization data.
Only locale and theme may remain as browser metadata.

Messages include a per-tab origin and logical stamp. Exact parsing, deterministic last-write-wins
ordering, and origin checks prevent echo loops. Organization updates broadcast full state; UI-only
updates broadcast the bounded projection. This provides convergence between local tabs, not users,
history, collaborative cursors, or remote synchronization.

## Store and UI boundaries

- `OrgStore` owns the organization catalog, Views, derived structures, durable UI projection, and
  separate organization/UI change sequences.
- `OrgViewsStore` owns structural View documents and editor stores.
- `AutomaticStateWriter` owns write serialization and retry state.
- `StateRuntimeController` owns hydration, tab synchronization, environment theme/locale updates,
  and write observation; the SQLite transport is imported only by `apps/ui`.
- Import owns one transient `File` and validated candidate. Export performs a direct download.
- Data Download remains a separate reporting pipeline for CSV, JSON, templates, and PNG.

The sidebar contains only product navigation, Import, state Export, language, theme, and its collapse
control. The header contains only the active section icon and title. Floating non-modal surfaces use
one neutral border and restrained shadow; hover and active states change tone without changing
geometry.

## Builds and development

`pnpm dev` starts the local server with webpack and warms `/` plus `/api/state`. `pnpm dev:check`
uses an isolated ignored database and Chromium to verify the root application, state API, local-only
requests, and Editor canvas. `pnpm build` produces the server build.

`pnpm pages:build` creates the ignored `pages-out` static application. `pnpm pages:check` requires
the `/org-tools` base path and rejects server chunks, SQLite symbols, database configuration, and
state API references. Publication is a separate guarded maintainer action.
