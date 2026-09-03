# Architecture

Org Tools has two deliveries over the same React, MobX, and strict `OrgToolsState` implementation.

- `apps/ui` is a local Next.js server bound to `127.0.0.1`. It renders the application and exposes
  the same-origin singleton state API backed by SQLite.
- `apps/pages` is a static Next.js export at `/org-tools`. It imports browser-safe UI only and keeps
  organization state in the memory of currently open tabs.
- `packages/types` defines the state, Employee, Unit, editor, and output contracts.
- `packages/screenshots` contains production browser checks, the shared strict browser-diagnostic
  collector, and the deterministic gallery.

## State contract

The public JSON value has exactly two top-level properties:

```ts
type OrgToolsState = {
  organization: {
    employeeFieldDefinitions: CustomEmployeeFieldDefinition[];
    employees: OrganizationEmployee[];
    structure: {
      layoutMode: OrgEditorLayoutMode;
      units: OrgEditorUnit[];
    };
    tags: EmployeeTagDefinition[];
  };
  ui: OrgToolsUiState;
};
```

There is no kind, content discriminator, version, compatibility alias, or partial transfer scope.
The organization has one current Unit structure. Viewport and selection live in the bounded
`ui.editor` projection so ordinary interface writes do not serialize the Employee catalog or Unit
graph. The UI projection also contains locale, theme, sidebar mode, active section, filters, searches,
calendar period, Analytics settings, and Data Download settings. Open surfaces, notifications, and
unfinished forms are transient.

State Import parses one detached value, validates exact keys, identifiers, dates, URLs, embedded
avatars, references, graph invariants, and UI references, then performs one atomic replacement.
Employee Import maps a flat or nested array, preserves imported UUIDs for new Employees, matches
existing Employees by normalized identity, and optionally upserts portable Team assignments and
typed custom Value fields. Export directly validates and downloads the complete current state.
Employee birthdays are nullable canonical `DD.MM.YYYY` strings; year `1900` is reserved for an
unknown year and recurrence indexes derive only their day and month. Old state shapes and former
birthday formats are rejected.

An Employee ID is a stable UUID v4 and never changes after identity edits. Duplicate detection uses
first name, last name, and email normalized with Unicode NFKC, trimmed and collapsed whitespace,
and locale-independent lowercase. Employee Import requires UUID plus all three identity fields,
keeps the current UUID for an identity match, and blocks UUID collisions with another identity.

Tags are normalized shared catalog entities with stable UUIDs and an optional semantic color;
Employee records store only `{ tagId, date }` assignments. Custom fields also have UUID identity and
a unique ASCII token key. Value fields store typed values, while Template fields form an acyclic
dependency graph and may hash their UTF-8 result with MD5 or SHA-256.

Avatar input is decoded from an explicit local PNG, JPEG, or WebP source. Canvas preparation and the
512 by 512 crop request WebP first, accept a browser-selected PNG, and explicitly retry PNG when the
WebP attempt fails. The resulting local data URL must pass the existing avatar type and byte limits
before it replaces the Employee draft; no source image, crop, or fallback output leaves the browser.

## Local SQLite runtime

`/` renders the application directly. `GET /api/state` returns `{ revision, state }` and
`PUT /api/state` accepts exact `organization`, `ui`, or `all` scoped updates. A protected exact-body
`POST /api/state` with `{"action":"create_new"}` is available only from the blocking startup error
surface: after confirmation it closes the shared connection, moves the database plus existing
rollback, WAL, and shared-memory sidecars to one timestamped backup family, and creates and validates
a blank exact-schema database. A partial filesystem failure restores every moved original. Every response uses
`Cache-Control: no-store`. Mutations require JSON, a loopback Host, and a matching same-origin
Origin. CORS is not enabled.

SQLite has one strict current shape: one `application_state` row with `organization_json`, `ui_json`,
revision, and timestamps. The repository uses prepared statements, immediate transactions, rollback
journal mode, `foreign_keys=ON`, `synchronous=FULL`, and a busy timeout. An empty database receives
exactly that shape. Startup otherwise accepts only its exact table and columns; obsolete, incomplete,
unknown, and corrupt databases are blocked without mutation. There is no schema marker, migration,
compatibility reader, or automatic reset.

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
or user-controlled autosave.

## Static runtime and tab synchronization

The static runtime never imports server modules or references `/api/state`. A new tab makes a bounded
series of requests for the latest state over the same-origin `BroadcastChannel`, avoiding browser
channel-registration races without delaying the empty-state fallback. A live tab answers with the
current validated state; if no tab answers, the new tab starts empty. Closing the final tab destroys
organization data.
Only locale and theme may remain as browser metadata.

Locale bootstrap accepts `en`, `zh`, `ru`, `es`, `fr`, and `ar`. A valid stored preference is used
for a new state before the first supported `navigator.languages` entry and the English fallback;
loaded SQLite, imported, or live-peer state then remains authoritative. The provider owns document
`lang` and `dir`, local date/number/plural formatting, and one locally bundled Noto Sans family
member per script. Arabic mirrors the shell and portals while the Editor world layer remains LTR.

Messages include a per-tab origin and logical stamp. Exact parsing, deterministic last-write-wins
ordering, and origin checks prevent echo loops. Organization updates broadcast full state; UI-only
updates broadcast the bounded projection. This provides convergence between local tabs, not users,
history, collaborative cursors, or remote synchronization.

## Store and UI boundaries

- `OrgStore` owns Employees, custom field definitions, the Tag catalog, the current Unit structure, derived indexes, durable UI projection, and
  separate organization/UI change sequences.
- `OrgEditorStore` owns the single structural document, history, selection, viewport, and commands.
- `AutomaticStateWriter` owns write serialization and retry state.
- `StateRuntimeController` owns hydration, tab synchronization, environment theme/locale updates,
  and write observation; the SQLite transport is imported only by `apps/ui`.
- Import owns one transient `File`, representative record, mapping, and validated candidate. Employee
  source paths and the first richest record are derived in one pass; a bounded JSON rendering and
  left-to-right mapping stay transient. Global Export validates and
  downloads the complete current state only after an explicit action.
- Data Download is a separate reporting pipeline for structured JSON and separator templates.
  JSON creates one record per Employee from one sortable top-level list of scalar Employee fields
  and optional Unit and Tag arrays. Unit and Tag rows use the same geometry as scalar fields, retain
  independently sortable nested fields, and support naming plus exact exclusions. Template retains
  All Units and First Unit row modes through one control shared with Editor export. Both Template
  surfaces use one multiline Format input whose caret menu converts `@query` into existing `{token}`
  syntax; suggestion state is transient.

Org Editor PNG output uses the same pure card geometry as the live canvas for Unit widths, 72 px
headers, roster padding, centered avatars, Employee text columns, compact tag packing, variable row
heights, and hierarchy anchors. The selected export font measures one immutable tag layout per
Employee; an oversized label wraps in full inside one taller chip, and the resulting block height
drives rows, Unit bounds, and connections. Its deterministic canvas painter keeps Unit identity,
Employee summary, and boss treatment while excluding Static/Live membership type, transient
selection, hover, handles, and menus. Its bounded inline preview has no secondary full-image
viewer. Image titles, backgrounds, fonts, icon-only alignment, scope, radius, Employee templates,
and Editor JSON settings remain output-only session settings and do not mutate the current
structure. Image template tokens exclude avatar bytes, while painted avatars remain available.
Editor JSON and Template use the same formatter and sortable field controls as Data Download while
limiting Employees and assignments to Unit-only or subtree scope.

Both runtimes expose the same Import, Export, language, and theme actions and retain identical
compact/expanded sidebar geometry. Language and Theme are independent modal radio selectors rather
than floating menus.
The header combines the active section icon and title with effect-registered contextual actions.
Units registers **Add Unit**; Employees registers **Employee model**, **Tags**, and **Add Employee**;
Data Download registers **Continue**. Inactive sections unregister without updating the shell during render. Thematic icons
precede their labels and collapse to an accessible icon-only control with a tooltip on narrow
screens. Floating non-modal surfaces use one neutral border and restrained shadow; hover and active
states change tone without changing geometry.

The Units split workflow uses equal desktop panes and equal-height mobile rows. It always shows its
indexed hierarchy-name search for a nonempty structure, aligns both searches on one row, aligns the
selected path and roster controls with Employee avatars, and derives its compact roster count
from current membership below search. Direct and descendant Employees keep their existing group
order inside one contiguous virtualized roster without repeated section headings or counts. Calendar
day and dated-tag details reuse the virtualized
Employee card and action composition without redundant current/future or dated-event headings. Day
events form one virtualized vertical stream: Birthdays first, then each localized Tag heading and
its stable Employee list. A selected
dated tag is stored by normalized key so edits and deletions re-derive current events instead of
retaining a stale group snapshot. The month grid uses locale-aware weekday order, leading empty
cells, real weekend tones, a horizontal dated-Tag rail, and one Tag icon/count per occupied date.
Calendar day titles are assembled from locale parts; Russian omits its abbreviated year suffix.

Analytics derives birth-year counts and `all`, `male`, and `female` completed-age cohorts in the same
linear Employee pass as the existing distributions. Missing and `1900` birthdays are excluded.
Drill-down stores only a stable group/entry key and re-resolves current full Employee cards after an
edit or deletion.

The Editor omits the shared content header. History controls occupy a dedicated logical-start
surface; search and canvas commands occupy the logical end and mirror around the LTR world in
Arabic. The Editor keeps pointer and wheel previews outside the MobX structure document. One animation-frame
scheduler presents the latest viewport or Unit delta, while pointer release or wheel debounce
performs the single snapped command and persistence observation. A geometry-keyed spatial index
limits Unit and connection rendering to the visible world rectangle and is rebuilt only when
document geometry changes.
Dragging an already selected Unit past the movement threshold preserves the whole selection.
Selected-only Arrange lays out the induced selected hierarchy, keeps its center, avoids unselected
bounds, and commits one snapped history operation without moving other Units.

The Editor always presents the current Unit structure. It has no View selector, View-local Employee
copies, alternate structure documents, or View lifecycle. Data Download uses the same current
structure directly.

## Builds and development

`pnpm dev` starts the local server with webpack and warms `/` plus `/api/state`. `pnpm dev:check`
uses an isolated ignored database and Chromium to verify the root application, state API, local-only
requests, and Editor canvas. `pnpm build` produces the server build.

`pnpm pages:build` creates the ignored `pages-out` static application. `pnpm pages:check` requires
the `/org-tools` base path and rejects server chunks, SQLite symbols, database configuration, and
state API references. Publication is a separate guarded maintainer action.
