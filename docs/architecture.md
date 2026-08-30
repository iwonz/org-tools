# Architecture

org-tools has two delivery modes over the same in-memory MobX product and strict unversioned
`OrgToolsState`. The local Next.js server binds to `127.0.0.1` and persists multiple projects in one
SQLite database through a same-origin API. The browser-only Next.js static export manages one local
JSON file or a tab-lifetime workspace without a backend. Import and Export use the same complete
`content: "workspace"` contract in both modes.

## Workspace layout

- `apps/ui` contains the Next.js runtime, local API, SQLite repository, React components, stores,
  parsers, exporters, and UI tests.
- `apps/pages` contains the static-export app tree and configuration. It reuses browser-safe
  components and stores from `apps/ui` but never imports the server repository or API routes.
- `packages/types` defines the public state, Employee, Unit, View, and editor contracts.
- `packages/screenshots` contains production-build browser smoke tests and deterministic PNG
  capture.
- `openspec` contains active changes and canonical capability specifications.

The `pnpm spec -- ...` wrapper is the repository entry point for OpenSpec and disables its
development-only anonymous telemetry.

The local production build is a Next.js server build in `apps/ui/.next`; `pnpm start` binds it to
`127.0.0.1`. The separate `apps/pages` build uses `output: "export"`, `basePath: "/org-tools"`, and
unoptimized local images. It provides the full client product but deliberately omits multi-project
SQLite persistence and server mutation handlers.

`pnpm dev` selects webpack explicitly, matching the supported production compiler instead of relying
on the Next.js development default. Its watcher excludes the reserved `.org-tools` and
`.playwright-cli` path segments, so database, journal, runtime-configuration, snapshot, and browser
log writes cannot invalidate application modules or interrupt root navigation. The bounded launcher
warms the root route, current project, and project API before presenting the workspace URL, avoiding
a first-browser hydration race with Next's on-demand route compilation. It forwards termination to
the owned server and never requests a non-loopback URL. A root-only Node.js Proxy resolves the
current project through a
short-lived SQLite connection and issues the stable redirect before rendering; database failures
fall through to the existing localized recovery page. `pnpm dev:check` verifies that boundary
independently: it reserves a
loopback port, creates a unique database below the ignored runtime directory, checks root project
resolution and the project list API, then uses the existing Playwright Chromium installation to
require the stable project URL, application shell, and Editor canvas. It closes the browser,
terminates the server child, and removes its temporary runtime child on every outcome. This is a
functional startup probe rather than a replacement runtime.

GitHub Pages receives the browser-only Next.js export in ignored `pages-out`, plus `.nojekyll`.
`pnpm pages:check` requires application HTML, local CSS and JavaScript with the `/org-tools` base
path, and rejects SQLite symbols, project API routes, server chunks, and database configuration. A
manually dispatched Actions workflow builds and validates that artifact, uploads it through the
official Pages artifact action, and deploys it to the `github-pages` environment.

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
SQLite state_json ──strict read + UI overlay──────┐
selected JSON file ──strict workspace read────────┼──> in-memory stores ──> UI and local output
workspace Import ──validate + atomic replacement─┘          │
                                                             ├──Save──> SQLite
                                                             ├──Save──> selected file/download
                                                             └──Export──> workspace JSON download
```

The shell consumes a discriminated persistence controller. The SQLite controller exposes project
CRUD, stable URLs, revision conflicts, bounded UI saves, and project Save. The browser controller
exposes New project, Open project, Save, Save As, file conflicts, and fallback download. Browser entry
code imports only the latter; shared product components depend on the controller interface rather
than on project routes.

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

`OrgToolsState` is the sole current transfer format. Its `content` discriminator is the literal
`"workspace"`. The parser verifies the exact structure, UUID identifiers, Employee tag records and
dates, references, URLs, avatar bounds, required normalized Employee gender enum, UI references, and
graph invariants before any mutation. Former partial scopes and arbitrary JSON are rejected without
migration or fallback.

Workspace Import keeps only the selected `File`, validated detached candidate, summary counts, and
owned error transiently. Confirming performs one complete store replacement, including theme and UI
state, without changing the persistence controller's project identity or browser file handle.
Workspace Export creates and validates the current live snapshot once and immediately downloads it;
there is no projection serializer or export dialog. The data Download session remains an independent
reporting pipeline for CSV, JSON, templates, and PNG.

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
- The workspace Import dialog owns one transient file, complete validated candidate, and summary.
- The workspace Export action validates and downloads one complete live-state snapshot.
- The locale provider owns the independent `en` or `ru` UI preference and updates document metadata.

Derived indexes resolve IDs into display models and search documents. Components receive resolved
data through props and shared list components instead of rebuilding indexes during render.

## Persistence and current-schema policy

The active project or file is edited as an in-memory working copy. Organization mutations make it
dirty. Explicit **Save** and `Ctrl+S`/`Cmd+S` always remain available. Optional autosave is off by
default and uses one 1000 ms trailing debounce with one write in flight; changes made during a write
schedule the next save. SQLite Save increments `state_revision`, while browser Save writes and
closes the bound file before reporting success. Both modes pause autosave on error or conflict.

Theme, tab, active View, viewport, and selection never make organization data dirty. SQLite stores
that bounded UI overlay after 300 ms. Browser mode does not persist it as organization data.
IndexedDB `org-tools-browser` stores only `active-file-handle`; local storage stores only theme,
locale, and the `org-tools-autosave-enabled` boolean. No organization snapshot enters browser
storage.

The browser controller uses File System Access only after a direct action and checks both picker
functions at runtime. Open accepts only a strict `content: "workspace"` file. Before each write it
compares `lastModified` and size with the last known fingerprint. An external change offers Load
file, Overwrite file, Save As, or Cancel. A remembered handle with missing permission blocks editing
behind Reconnect file or Start blank; corrupt or unavailable files are never replaced silently. If
the APIs are unavailable, Open uses a JSON file input, Save downloads `org-tools-state.json`, the
working copy lasts only for the tab, and autosave UI is not rendered.

Downloading still produces `org-tools-state.json`, and importing changes only the current working
copy until Save. Locale remains the independent `org-tools-locale` browser preference and is not
part of `OrgToolsState`. The public state interface deliberately has no version fields and is
unchanged by project persistence; database schema versioning is private to the local runtime.
