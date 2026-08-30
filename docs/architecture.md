# Architecture

org-tools is a local Next.js server application backed by an in-memory MobX working copy and one
SQLite database. The server binds to `127.0.0.1`, serves the UI, and exposes a same-origin project
API. Each durable project keeps one strict unversioned `OrgToolsState` snapshot; JSON Import and
Export remain the transfer and backup boundary for the current project. The same public state
envelope still carries scoped Teams, Employees, Teams + Employees, or Full workspace content.

## Workspace layout

- `apps/ui` contains the Next.js runtime, local API, SQLite repository, React components, stores,
  parsers, exporters, and UI tests.
- `packages/types` defines the public state, Employee, Unit, View, and editor contracts.
- `packages/screenshots` contains production-build browser smoke tests and deterministic PNG
  capture.
- `openspec` contains active changes and canonical capability specifications.
- `examples` contains small, explicitly synthetic JSON imports.

The `pnpm spec -- ...` wrapper is the repository entry point for OpenSpec and disables its
development-only anonymous telemetry.

The production build is a Next.js server build in `apps/ui/.next`. `pnpm start` binds it to
`127.0.0.1`; arbitrary static hosting is intentionally unsupported because a browser cannot write a
real SQLite file and a static export cannot provide mutation handlers.

The application uses `/projects/<uuid>` as its stable project route. `/` resolves the last opened
project, creating `New project` when the database is empty, and redirects to that stable URL. A
client locale provider statically imports the English and
Russian catalogs, deterministically encodes reserved periods in sentence-style UI IDs, and passes
the active namespace-safe catalog to `NextIntlClientProvider`. The typed UI wrapper applies the same
encoding during lookup. There are no locale URL segments or catalog fetches.

The single-route shell owns a dark collapsible sidebar and a context-only workflow header. The
sidebar keeps the existing Radix product-tab state and order, co-locates the project switcher,
language, theme, Import, and workspace Export actions, and switches between a 240 px labelled panel
and a 64 px icon rail.
Narrow layouts use the icon rail through responsive CSS. Collapse state is component-local and is
not added to MobX workspace state, exported files, or browser storage.

## State flow

```text
SQLite state_json ──strict read + UI overlay─────────────┐
scoped state JSON ──strict projection + append/replace───┼──> in-memory stores ──> UI and local export
ordinary JSON ──nested mapping and atomic append─────────┘          │
                                                                    └──explicit Save──> SQLite
```

SQLite schema v1 stores multiple projects in `projects`, the last opened project in the singleton
`app_state` row, and its internal schema version in `PRAGMA user_version`. `state_json` is a complete
validated workspace snapshot. `ui_json` is a bounded overlay containing the active tab and View,
theme, selected and expanded Units, and per-View viewport and selection. Dangling UI references are
discarded when a project opens. The repository uses prepared statements, `foreign_keys=ON`, rollback
journal mode, `synchronous=FULL`, a busy timeout, and atomic transactions. It deliberately avoids
WAL so a stopped, idle runtime has one durable database file.

The path resolves in strict precedence order: `ORG_TOOLS_DB_PATH`,
`.org-tools/config.json`, then `.org-tools/org-tools.sqlite3`. Relative paths resolve from the
repository root. Invalid configuration or an inaccessible path is a blocking error; there is no
ephemeral fallback. The connection is opened lazily and reused across development hot reloads.

`GET /api/projects`, project CRUD, revisioned state Save, and last-write-wins UI Save form the local
same-origin API. Every response is `Cache-Control: no-store`. Mutations accept only JSON and require
a matching loopback Origin and Host. The runtime does not enable CORS.

`OrgToolsState` is the sole current transfer format. Its `content` discriminator declares Teams,
Employees, Teams + Employees, or Full workspace. A parser verifies the declared scope, exact
structure, UUID identifiers, Employee tag records and dates, references, URLs, avatar bounds, and
the required normalized Employee gender enum before graph invariants and any mutation. Partial
states contain one canonical Main View and UI shell;
Full workspace can contain every View and UI field. Obsolete and scope-mismatched shapes are
rejected without migration.

`ImportSessionStore` keeps the selected state projection and operation or the ordinary file
collection, mappings, preview, and errors transiently. Preview plans retain normalized Employees,
ordered Team hierarchy, manual assignment references, and separate Live role references. The dialog
flattens that graph into dynamically measured virtual rows without duplicating Employee records.
Recognized state append resolves Employee identity, remaps UUIDs and references, translates imported
layout into a free Main area, and retains custom Views and UI. Partial replace installs a clean
projection; Full workspace always replaces.

Ordinary JSON maps recursive children and inline Employee arrays. These sources create manual Teams
only and always append. Conflicting keys, ambiguous identities, and multiple bosses block the
detached complete candidate. The production state parser validates every candidate before one store
mutation.

The workspace Export dialog snapshots complete state once and runs all four choices through pure state
projection serializers. Every result is parsed through the production state parser before download.

Employee tags use one normalized runtime record with a label and nullable `YYYY-MM-DD` date. Search
documents, Live rules, and option identity project only labels. Shared derived indexes group exact
dated-tag events by ISO day and normalized label alongside birthday indexes, so Calendar cells and
virtualized dialogs do not rescan the Employee catalog during render.

Employee gender is one required stable value: `male`, `female`, or `unspecified`.
Transient Employee search documents carry that value for exact-value catalog filters. Live Unit
rules deliberately omit gender, so the new field does not expand the persisted rule contract or
trigger inference from names, avatars, or other profile data.

Tag dates stay behind focused calendar popovers. Cards and the Org Editor render every chip with
wrapping. The interactive canvas uses deterministic packing to produce variable Employee row heights
and prefix offsets for virtualization, hit testing, connections, layout, and bounds. Localized PNG
rendering uses a card-consistent neutral chip profile whose shared paint and row-allocation geometry
keeps exported bounds compact and aligned.

The Editor uses one 24-unit document-space coordinate grid. Explicit coordinate-producing commands
snap affected Unit origins in the editor store; opening a workspace does not normalize untouched
legacy coordinates. The canvas derives a power-of-two visible grid interval from the current scale,
then paints it as a constant-cost CSS background aligned to the viewport origin. Visible grid lines
therefore remain legible across zoom levels and always describe valid snap coordinates.

Employee avatar editing is also a local draft pipeline. A bounded file or clipboard Blob is decoded,
optionally downscaled to a temporary 4096-pixel preview, positioned through `react-easy-crop`, and
drawn to a 512-by-512 WebP canvas. Only the validated data URL enters the Employee draft; temporary
object URLs and the original source are not retained.

## Store responsibilities

- The organization store owns the global Employee catalog and canonical Main View.
- The Views store owns custom View documents and their independent editor stores.
- Each editor store owns document commands, canvas selection, layout, viewport, and undo/redo.
- The data-download session owns transient source selection and output settings.
- The import session owns transient file parsing, projection choice, operation, mappings, and previews.
- The workspace Export dialog owns a transient complete-state snapshot and selected download shape.
- The locale provider owns the independent `en` or `ru` UI preference and updates document metadata.

Derived indexes resolve IDs into display models and search documents. Components receive resolved
data through props and shared list components instead of rebuilding indexes during render.

## Persistence and current-schema policy

The active project is edited as an in-memory working copy. Organization mutations make it dirty and
are serialized only by explicit **Save** or `Ctrl+S`/`Cmd+S`; a successful transaction increments
`state_revision`. A stale revision produces a conflict instead of overwriting either version. Theme,
tab, active View, viewport, and selection never make organization data dirty and update only the
bounded UI overlay after 300 ms. Organizational content is never written to browser storage.

Downloading still produces `org-tools-state.json`, and importing changes only the current working
copy until Save. Locale remains the independent `org-tools-locale` browser preference and is not
part of `OrgToolsState`. The public state interface deliberately has no version fields and is
unchanged by project persistence; database schema versioning is private to the local runtime.
