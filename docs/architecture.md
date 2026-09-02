# Architecture

Org Tools has two deliveries over the same React, MobX, and strict `OrgToolsState` implementation.

- `apps/ui` is a local Next.js server bound to `127.0.0.1`. It renders the application and exposes
  the same-origin singleton state API backed by SQLite.
- `apps/pages` is a static Next.js export at `/org-tools`. It imports browser-safe UI only and keeps
  organization state in the memory of currently open tabs.
- `packages/types` defines the state, Employee, Unit, View, editor, and output contracts.
- `packages/screenshots` contains production browser checks, the shared strict browser-diagnostic
  collector, and the deterministic gallery.
- `skills/org-tools` is the public instruction-only Agent Skill installed by supported clients; the
  application never executes it or its installer.

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

Avatar input is decoded from an explicit local PNG, JPEG, or WebP source. Canvas preparation and the
512 by 512 crop request WebP first, accept a browser-selected PNG, and explicitly retry PNG when the
WebP attempt fails. The resulting local data URL must pass the existing avatar type and byte limits
before it replaces the Employee draft; no source image, crop, or fallback output leaves the browser.

## Local SQLite runtime

`/` renders the application directly. `GET /api/state` returns `{ revision, state }` and
`PUT /api/state` accepts exact `organization`, `ui`, or `all` scoped updates plus the caller's
`expectedRevision`. Every response uses
`Cache-Control: no-store`. Mutations require JSON, a loopback Host, and a matching same-origin
Origin. CORS is not enabled.

SQLite has one strict current shape: one `application_state` row with `organization_json`, `ui_json`,
revision, and timestamps, plus singleton `mcp_settings`, expiring `mcp_previews`, and bounded
`mcp_changes`. The repository uses prepared statements, immediate transactions, rollback journal
mode, `foreign_keys=ON`, `synchronous=FULL`, and a busy timeout. An empty database receives exactly
that shape. Startup otherwise accepts only its exact managed tables and columns; obsolete,
incomplete, unknown, and corrupt databases are blocked without mutation. There is no schema marker,
migration, compatibility reader, or automatic reset.

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

`GET /api/state/events` streams process-local revision notifications without state bytes. MCP writes
trigger a refresh in every connected browser. The controller keeps the last accepted base state and
performs a stable-ID three-way merge. Independent local and MCP fields are written back automatically;
overlap opens a localized **Keep local**, **Use MCP**, or **Cancel** decision instead of silently
discarding either value.

## Embedded MCP boundary

The local server exposes a stateless Streamable HTTP endpoint at `POST /mcp`. A transport guard
requires a loopback Host, no Origin or the matching loopback Origin, JSON, and the enabled bearer
token. GET, DELETE, OPTIONS, CORS, remote bind, and legacy SSE are unavailable. Same-origin control
routes expose settings, token lifecycle, activity, and confirmed UI Undo; they never include MCP
metadata in `OrgToolsState`.

Typed operations execute against a detached state, replace temporary references with UUIDs, validate
the complete result, and create a semantic field diff. A preview is immutable for ten minutes. Apply
checks the stored base revision in one immediate transaction, writes one organization snapshot,
advances the revision once, records forward/inverse diffs, and returns the same result on a repeated
retained Apply. Selective Undo accepts only values that still equal the earlier Apply result. The
activity journal retains at most 100 changes and 64 MiB; applied preview payloads are compacted.

Read tools cache the validated state and derived View structures by revision. Collections are cursor
paginated to 100 records and avatar bytes are opt-in. Resources, prompts, annotations, server
instructions, and the public skill encode Preview → explicit approval → Apply and require agents
to treat stored organization fields as untrusted data.

## Static runtime and tab synchronization

The static runtime never imports server modules or references `/api/state`, `/mcp`, MCP dependencies,
tokens, or control UI. A new tab makes a bounded series of requests for the latest state over the
same-origin `BroadcastChannel`, avoiding browser channel-registration races without delaying the
empty-state fallback. A live tab answers with the current validated state; if no tab answers, the new
tab starts empty. Closing the final tab destroys organization data.
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

Org Editor PNG output uses the same pure card geometry as the live canvas for Unit widths, 72 px
headers, roster padding, centered avatars, Employee text columns, compact tag packing, variable row
heights, and hierarchy anchors. The selected export font measures one immutable tag layout per
Employee; an oversized label wraps in full inside one taller chip, and the resulting block height
drives rows, Unit bounds, and connections. Its deterministic canvas painter keeps Unit identity,
Employee summary, and boss treatment while excluding Static/Live membership type, transient
selection, hover, handles, and menus. Image titles, backgrounds, fonts, scope, radius, and Employee
templates remain output-only settings and do not mutate the View document.

The server sidebar adds **MCP** after state Export; its icon is green only while enabled. The static
sidebar has no MCP slot, accessible action, dialog, endpoint request, or imported MCP control. Both
retain identical compact/expanded geometry. The MCP modal contains
Setup and Activity; Setup builds one English agent prompt with the selected-client skill install,
current local endpoint and token, exact client configuration, reload step, and read-only connection
check. The prompt exists only in component memory and the clipboard.
The header combines the active section icon and title with one effect-registered contextual action
slot. Units registers **Add Unit**, Employees registers **Add Employee**, and Data Download registers
**Continue**; inactive sections unregister without updating the shell during render. Thematic icons
precede their labels and collapse to an accessible icon-only control with a tooltip on narrow
screens. Floating non-modal surfaces use one neutral border and restrained shadow; hover and active
states change tone without changing geometry.

The Units split workflow omits its tree-search header entirely below the search threshold, aligns
selected-path and roster search controls with Employee avatars, and derives its compact roster count
from current membership below search. Direct and descendant Employees keep their existing group
order inside one contiguous virtualized roster without repeated section headings or counts. Calendar
day and dated-tag details reuse the virtualized
Employee card and action composition without redundant current/future or dated-event headings. Day
events group by Employee while preserving each label as an explicit tag-history action. A selected
dated tag is stored by normalized key so edits and deletions re-derive current events instead of
retaining a stale group snapshot. MCP Setup/Activity,
Enable/Disable, and token-rotation controls keep decorative icons before their visible labels. The
Client setup selector uses an exhaustive local icon mapping for all seven supported agents, with no
remote brand assets or runtime requests.

The Editor keeps pointer and wheel previews outside the MobX View document. One animation-frame
scheduler presents the latest viewport or Unit delta, while pointer release or wheel debounce
performs the single snapped command and persistence observation. A geometry-keyed spatial index
limits Unit and connection rendering to the visible world rectangle and is rebuilt only when
document geometry changes.

The Editor presents the canonical main-kind View with the same localized label as the Units
destination. That View remains protected from rename and deletion. Management actions remain
available for every custom View, including an empty canvas. Confirmed custom View deletion removes
its document and derived selection/viewport UI, returns an active Editor to the canonical View, and
falls a deleted Data Download source back to that canonical View before the next strict snapshot.

## Builds and development

`pnpm dev` starts the local server with webpack and warms `/` plus `/api/state`. `pnpm dev:check`
uses an isolated ignored database and Chromium to verify the root application, state API, local-only
requests, and Editor canvas. `pnpm build` produces the server build.

`pnpm mcp:check` initializes a 2025-era client against the actual route contract, checks tool,
resource, prompt, and annotation discovery, performs Preview → Apply, verifies idempotency, and probes
transport rejection.

`pnpm skill:check` validates the public skill layout, frontmatter, instruction-only boundary, source
language, required safety guidance, and absence of credentials or placeholders without using the
network.

`pnpm pages:build` creates the ignored `pages-out` static application. `pnpm pages:check` requires
the `/org-tools` base path and rejects server chunks, SQLite symbols, database configuration, and
state API or MCP references. Publication is a separate guarded maintainer action.
