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
    analytics: AnalyticsConfiguration;
    employeeDisplayFormats: EmployeeDisplayFormats;
    employeeDisplayLineGaps: EmployeeDisplayLineGaps;
    employeeFieldDefinitions: CustomEmployeeFieldDefinition[];
    employees: OrganizationEmployee[];
    tags: EmployeeTagDefinition[];
    views: OrgToolsViewDocument[];
  };
  ui: OrgToolsUiState;
};
```

There is no kind, content discriminator, version, compatibility alias, or partial transfer scope.
Exactly one View is the unnamed system document displayed as **Units**; Units, Employee Import, and
Analytics use it directly. Custom Views have normalized unique names and isolated Unit documents,
assignments, Live rules, hierarchy, layout, and geometry. Employees, custom fields, and Tags remain
global references shared by every View. Viewport, selection, and enabled distribution-mode Unit IDs
live per View in the bounded
`ui.editor` projection, while Data Download persists its selected source View. Ordinary interface
writes therefore do not serialize Employees or structural documents. Open surfaces, notifications,
search suggestions, and unfinished forms are transient.

The required `employeeDisplayFormats` and `employeeDisplayLineGaps` objects store one template and
one bounded pixel gap for Employees, Units, Editor DOM, and Editor image output. The shared renderer
resolves built-in Unit and Employee fields plus custom fields, evaluates the existing token and
conditional grammar, joins arrays with `; `, removes dynamically empty rows, and preserves authored
internal blank rows. It then parses only inline Markdown into a shared rich-line model. Employee and
custom-field values enter that model as text nodes, so their punctuation cannot become formatting.
Tags and compound assignments remain semantic groups. A platform-neutral inline layout preserves
each resolved authored line as a measured format block and places text, Markdown runs, Tags, and
`Position · Unit` assignments in source order on shared child rows. It wraps by word and grapheme
and emits content-sized fragment rectangles. A bounded Canvas cache
measures the actual UI or fixed system image font, weight, style, and code family; it is invalidated
after bundled fonts load. DOM renders those fragments without constraining glyphs to an approximate
fragment width, while Canvas paints the same rectangles. Every Tag and assignment surface uses
11 px type, 16 px line height, 8 px horizontal and 2 px vertical padding, 6 px radius, and 6 px row
and column gaps. A Tag or assignment continuation inside one block uses the fixed 6 px gap. The
configured display gap separates adjacent format blocks and ordinary text wraps, contributes no
outer space, and cannot change a single-block height. List DOM renders the outer blocks as one
vertical flex stack while Editor geometry and Canvas use the same flattened global child-row
coordinates. `{position}`, `{unitName}`, `{fullName}`,
`{profileUrl}`, `{email}`, and custom tokens remain ordinary text values. List and fallback contexts
aggregate system-View assignments in structural order; one Unit or Editor row resolves only that
Unit. `isBoss` is a condition-only boolean; visible text belongs in a ternary branch. Plain
tokens remain text; an explicit safe Markdown link can add navigation in interactive lists and
remains styled but inert in Editor and PNG. Only the Unit-name fragment inside `{positions}` has
implicit navigation, and only Employees and Units cards enable it. Fallback cards, drag previews,
Editor, and PNG keep the fragment inert. A custom-field key rename rewrites all four templates in the same action, and a referenced
custom field cannot be deleted. The Editor DOM and PNG renderer share word/character wrapping,
authored blank rows, line gaps, rich-line counts, wrapped chip rows, row heights, offsets, text
width, Unit bounds, hit testing, and anchors. Image dialogs clone the saved Editor-export format and
line gap into transient settings.

The Employee Display tab reads these organization values directly. Each valid format or bounded
integer gap edit calls a focused no-op-aware store action, so MobX observation immediately drives
the existing coalesced SQLite writer or `BroadcastChannel` publisher. Invalid number-input text
stays in the mounted input until blur or Enter normalizes it. Per-format Reset resolves the current
locale's maintained default at activation time and updates only that format. Blank State starts all
four gaps at 5 pixels and uses `**{fullName}** {positions} {tags}` for Employees and Units.

Each View owns required `structure.settings`: `groupByTag` and `showTagCloud` default to true;
`distributedColor` and `undistributedColor` default to green and amber and use non-null named or
canonical six/eight-digit HEX colors. Settings participate in the existing View-local document
history and complete state boundaries. Unit documents contain no grouping preference. Copying a
View clones settings; Unit Paste follows target settings. The View toolbar dialog applies one
command per switch or completed color choice, and its transient draft closes when the View changes.
The boss is always first; remaining Employees group by their earliest catalog Tag rank, then use
stable full-name/ID order, with untagged Employees last. Disabled grouping uses full-name order after
the boss. DOM, PNG, virtual row offsets, selection, reveal, and distribution anchors share this
sequence. Hidden Tag clouds contribute zero footer height to every geometry consumer and PNG;
Employee Tags remain visible. No group headings or duplicate rows are introduced.

Manual Units also own required `openPositions`. These View-local UUID records contain a normalized
title, a required nullable named/custom background color, and dated or undated assignments to the
global Tag catalog, but never create an Employee. The shared color resolver paints a configured
background over the complete shared row bounds in DOM and PNG, preserving an eight-digit color's
actual alpha; `null` keeps the surface unconfigured, and transient selection or drop feedback takes
precedence.
Employee and open-position rows form one discriminated, prefix-offset layout for sorting,
virtualization, hit testing, side anchors, DOM, and PNG. Boss Employees remain first; position Tags
affect grouping without changing Employee counts or the Unit Tag cloud. Live Units require an empty
position array. The layout inserts exactly four logical pixels between adjacent row surfaces and no
row gap before the first or after the last surface; Unit height, hierarchy placement, anchors, DOM,
and PNG all consume those same offsets. View clone and Unit Paste preserve backgrounds, regenerate
position IDs, and remap
attachments; replacement rekeys the owner to an Employee occurrence in one history command, while
deletion detaches at the last resolved world point.

Each View also owns a required ordered `structure.canvasElements` discriminated union for Text,
Sticker, embedded Image, and cubic Arrow content. Rectangular tools share bounds, rotation, layer,
typography, and optional attachment state; Arrow endpoints use the same anchor references. One
anchor registry resolves Unit corners/sides/center, Employee and open-position row sides, rectangular tool anchors,
and Arrow start/middle/end. References are same-View, acyclic, and preserve fallback world geometry.
The array order is z-order inside `behindUnits` and `aboveUnits`; canvas elements participate in
View-local history, cloning, persistence, live-tab synchronization, and complete State transfer.
Plain element pointer selection replaces the previous selection while Ctrl/Cmd explicitly toggles
group membership. Creation-tool activation clears the previous item selection, and right-click is
routed through a discriminated element menu whose commands affect canvas elements only. Rectangle
and group frames use one zoom-compensated solid outline, four visible corner resize markers,
transparent side resize strips, and transparent outside-corner rotation targets. Resize uses local
axes, retains the opposite edge or corner, and normalizes rectangular width and height to whole
logical pixels without tightening validation of older fractional State. One rectangular element
rotates around its live center from current position and dimensions, compensating an attachment
offset so target resolution cannot move that pivot; groups retain the exact selected-bounds center.
Connector markers remain hidden for resting selection, hover, and focus. While the Arrow tool is
armed or an endpoint attachment is dragged, the existing spatial indexes resolve one topmost
eligible owner under the pointer, outline that owner, reveal its complete registry anchor set, and
emphasize only the nearest in-range anchor. Exact-anchor pointer-down creates an attached Arrow;
free-canvas pointer-down keeps a free endpoint. Image resize reads Shift from each pointer sample,
preserving proportions only while the modifier is held; the compatibility `lockAspectRatio` State
field no longer controls interaction. Escape clears a resting element selection after
higher-priority editing, menu, and transform interactions have handled the key. Text completion is
idempotent across capture, blur, Escape, and tool changes. Text and Sticker share a transient
contenteditable draft with grapheme-safe UTF-16 format runs, document-level range retention,
plain-text paste, caret styling, and one atomic history commit. One word-aware fragment layout
derives automatic or fixed Text geometry, Sticker overflow height and vertical alignment, effective
typography, visual lines, block/per-line fill bounds, anchors, resting DOM, draft bounds, and PNG
painting. Automatic Text stays tight between 48 by 32 and 480 by 320 logical pixels, uniformly
reduces rendered typography no lower than 8 px without mutating authored sizes, and grows beyond the
normal height cap only when the floor still cannot contain the content. Manual Text exposes all four
side and corner resize targets, retains its requested two-axis frame or the minimum non-clipping
height, and scales base/run authored sizes only during group resize. Current choices are System,
Georgia, Bebas Neue, Lobster, and Montserrat; every non-system face is local or bundled. The parser
also accepts historical families and weight 500, which resolve to System and Regular, plus the
immediately preceding exact Text and no-run Sticker shapes, which normalize without history. Sticker
fill and its one tonal border come from one shared flat-style helper without changing bounds or
anchors. Cubic Arrow endpoint and attached-target movement projects both controls through normalized
longitudinal/normal chord coordinates, with a one-third fallback for a near-zero source chord. The
contextual surface keeps applicable
appearance controls in one row and moves alignment and geometry into bounded popovers. Element
ordering, duplication, and deletion remain context-menu and keyboard commands rather than duplicated
property actions.

Every `OrgEditorUnit` owns a required LF-normalized `noteMarkdown` string bounded to 64 KiB of
UTF-8. Notes are part of the View-local structural document, so View cloning and cross-View
Copy/Paste preserve their source content while later edits remain independent. A note Save is one
Unit history command and one organization write; the open dialog draft is transient.

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

The `organization.tags` array is the sole persisted global Tag order. Derived Employees resolve
assignments in that order and carry one transient nullable `tagPriority` for the earliest Tag rank.
No rank is stored on Employee assignments. Catalog reordering replaces only the Tag array in one
logical operation and invalidates the existing derived View caches.

Tags are normalized shared catalog entities with stable UUIDs and an optional supplied semantic
color name or canonical lowercase six- or eight-digit HEX color;
Employee records store only `{ tagId, date }` assignments. Custom fields also have UUID identity and
a unique ASCII token key. Value fields store typed scalars or ordered unique Option UUID arrays.
Extensible multi-option values stage new normalized choices in the Employee dialog and commit the
definition plus Employee value in one store action. Composite definitions own ordered UUID-keyed
primitive subfields and one required primary key; Employee values are ordered record arrays keyed by
those subfield UUIDs. Template fields form an acyclic dependency graph and may hash their UTF-8
result with MD5 or SHA-256.

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

When delivery replaces the exact State shape, it must separately inspect the configured owned
database before publication. An immediately previous valid snapshot is converted only while the
owned runtime is stopped, after a timestamped ignored backup of the complete database family. A
detached candidate and the committed singleton row must both pass the production parser, preservation
fingerprints must remain stable, and the configured server must reopen normally. This guarded
one-time operation never becomes part of the runtime or public Import path.

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
ordering, and origin checks prevent echo loops. A delayed SQLite startup response cannot overwrite a newer
live-peer snapshot or lower its logical stamp. Organization updates broadcast full state; UI-only
updates broadcast the bounded projection. This provides convergence between local tabs, not users,
history, collaborative cursors, or remote synchronization.

## Store and UI boundaries

- `OrgStore` owns global Employees, custom field definitions, the Tag catalog, derived indexes,
  durable UI projection, and separate organization/UI change sequences. It materializes only the
  system, active Editor, and selected Download Views.
- Shared Employee filters derive one catalog-ordered Tag option list, filter it through a deferred
  transient query, and apply bulk selection to visible IDs without disturbing hidden selections.
  The Tag catalog retains that order and keeps Employee usage plus a positive With date count inline
  after the filled Tag. A leading handle supports captured pointer gestures and keyboard moves.
  A full-row inert overlay,
  row-sized placeholder, and animated siblings preview insertion against stable slot geometry.
  Edge scrolling stays inside the list; release inside commits once, while Escape, outside release,
  cancellation, closure, search changes, and catalog replacement discard the preview. Filtered moves
  insert relative to the target in the full catalog.
- Shared Tag color helpers keep named palette classes static and derive bounded light/dark and canvas
  fill/foreground pairs for named, custom, alpha, and neutral values. Non-opaque custom colors retain
  their real alpha in resting, hover, and active fills while their opaque foreground is selected
  against the composited light or dark surface. Flat catalog rows expose Eye, Color, Edit, and Delete
  in that order. The row-level modal color Popover owns its nested scroll lock and one local draft
  containing HSV, exact HTML Keyword/HEX/RGB/RGBA input, and a synchronized zero-through-hundred
  opacity value. A MobX-computed, non-persistent color index visits global Tags and every View in
  stable order only while a picker is open, without cloning State. It deduplicates resolved RGBA and
  exposes configured values as compact checkerboard-backed Used colors swatches. One wrapping
  listbox contains the optional No color chip and eight named chips.
  Only Apply emits the canonical nullable color once; Cancel, Escape, outside dismissal, invalid
  input, and unchanged Apply emit nothing. Edit is a separate rename-only modal. Eye resolves the
  current `tagId` into a virtualized full Employee-card list.
- `OrgViewsStore` owns View lifecycle, normalized names, document revisions, per-View editor state,
  and one transient tab-local clipboard shared by every View. Copy captures resolved membership and
  related canvas annotations; cross-View Paste regenerates Unit and canvas-element IDs, remaps
  internal hierarchy, Live, and anchor references, and materializes unavailable external references
  at their fallback geometry. Each View has one `OrgEditorStore` with isolated structure, history,
  selection, and viewport. Complete state replacement clears the clipboard, which is never
  persisted, broadcast, or written to the system clipboard.

Editor keyboard paste assigns each key gesture a transient request ID. The browser paste event
consumes that request and cancels its fallback; if no event arrives, one delayed fallback performs
the structural paste. Recently completed fallbacks suppress the matching late event, while later
request IDs remain independent.
- `AutomaticStateWriter` owns write serialization and retry state.
- Unit note drafts stay outside every store until Save. The lazily imported Markdown renderer uses
  GitHub Flavored Markdown without raw HTML or image elements; safe links require an explicit click
  and use `noopener`, `noreferrer`, and a no-referrer policy.
- `StateRuntimeController` owns hydration, tab synchronization, environment theme/locale updates,
  and write observation; the SQLite transport is imported only by `apps/ui`.
- Import owns one transient `File`, representative record, mapping, and validated candidate. Employee
  source paths and the first richest record are derived in one pass; a bounded JSON rendering and
  virtualized source-driven `JSON path → Org Tools target` mapping stay transient. Each target is
  unique, selecting it transfers it from the previous path, and a pending Value definition remains
  transactional with the final Apply. Global Export validates and
  downloads the complete current state, including every View, only after an explicit action.
- Data Download is a separate reporting pipeline whose source is the system or any custom View.
  Changing the source clears Employee/Unit selections, Unit exclusions, and source-specific filters
  while preserving field names, format, and global Tag exclusions. It produces structured JSON and
  separator templates.
  JSON creates one record per Employee from one sortable top-level list of scalar Employee fields
  and optional Unit and Tag arrays. Unit and Tag rows use the same geometry as scalar fields, retain
  independently sortable nested fields, and support naming plus exact exclusions. Template emits
  every retained assignment in structural order and preserves the direct-selection fallback for an
  unassigned Employee. Both Template surfaces expose transient Keep only unique values and Remove
  empty lines options; one streaming logical-line processor applies empty-line removal before exact,
  order-preserving deduplication for preview, Copy, Download, and all visible counts while JSON
  remains unchanged. Both Template
  surfaces and full-View Image Employee format use one multiline Format input whose caret menu
  converts `@query` into existing `{token}` syntax. A small help affordance and the placeholder
  disclose the shortcut; help also documents the existing `{condition ? 'value' : 'fallback'}`
  expression. The full-View Image dialog keeps its preview above one full-width settings block at
  every breakpoint. Tooltip, query, suggestion, and empty-line option state are transient.

Org Editor DOM and PNG output share a pure scene layer for persistent canvas-element geometry,
attachment resolution, text wrapping, rotated bounds, cubic extrema, and two-plane ordering. Full
View export includes all Units, hierarchy connections, and durable elements regardless of viewport;
Unit/subtree export includes only the structural closure and transitively related annotations, with
Arrows requiring two included endpoint owners. One render plan retains logical bounds, fixed
requested 3× density, effective density, final dimensions, and 8/32-megapixel plus canvas-side clamping before
rasterization. Both dialogs place their local object URL in one transient Fit-first viewport with
bounded pointer/keyboard pan and 10%-to-400% zoom. Manual inspection preserves its normalized focal
point across preview regeneration; viewport state and render-plan diagnostics are not persisted or
painted. Text and Sticker wait for every unique base/run family and weight before measurement;
Sticker uses the same live flat fill and tonal border, rich fragments, and nine-way alignment.
Global Back and Front move only
the selected ordered block to the extreme of `behindUnits` or `aboveUnits`, preserving every
attachment while crossing the indivisible Unit-card plane. Text, Sticker, Image, and Arrow painters
omit every transient selection, target outline, anchor, resize, rotation,
Bezier, marquee, and placement affordance.

Org Editor PNG output also uses the same pure card geometry as the live canvas for Unit widths, 72 px
headers, roster padding, centered avatars, Employee text columns, universal inline fragments, variable
row heights, and hierarchy anchors. Each Employee receives one immutable rich layout that DOM,
geometry, and PNG consume. An oversized semantic value becomes several content-sized decorated
fragments, and the resulting height drives rows, Unit bounds, hit testing, anchors, and connections.
Its deterministic canvas painter keeps Unit identity,
Employee summary, Employee-format inline Markdown, native Employee Tags and compound assignments,
direct-membership Tag footer, Tag tonal colors, boss treatment, and persistent
active-View distribution row tones while excluding Static/Live membership type, transient
selection, hover, focus, handles, menus, placement paths, and endpoint markers. Distribution status
uses the complete active-View direct-membership index even when its other placement is outside the
selected image scope. Its bounded inline preview has no secondary full-image viewer. Image
backgrounds, scope, spacing, radius, Employee templates, and Editor JSON settings remain output-only
session settings and do not mutate the active View. Standard structure text uses the system UI font;
persistent Text and Sticker elements retain their own typography. The painter deliberately uses
the light export palette; shared semantic status, geometry, and tonal helpers keep stable DOM and PNG
card presentation aligned. Every later persistent canvas element, anchor behavior, View setting, or
stable Unit/Employee card presentation change must define and test its applicable DOM and PNG
behavior in the same change.
Image template tokens exclude avatar bytes, while painted avatars remain available.
Unit footer Tags use the shared actual-font fragment layout for DOM and PNG row packing, card bounds,
connections, and collision geometry. Every wrapped part owns only its content width and cloned
decoration. The count suffix stays indivisible with the shared 8 px trailing inset and no footer
label uses an ellipsis. The bounded measurement cache prevents repeated per-row Canvas work.
Editor JSON and Template use the same formatter and sortable field controls as Data Download while
limiting Employees and assignments to Unit-only or subtree scope.

Both runtimes expose the same Import, Export, language, and theme actions and retain identical
compact/expanded sidebar geometry. Language and Theme are independent modal radio selectors rather
than floating menus; the six Language rows use bundled decorative SVG flags.
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
cells, dedicated light/dark rose weekend tones, a horizontal dated-Tag rail, and one Tag icon/count per occupied date.
Only occupied dates expose the day-dialog button; empty dates retain cell geometry without hover or
activation. Calendar day titles are assembled from locale parts; Russian omits its abbreviated year suffix.

Analytics stores one anonymous configuration under `organization.analytics`: ordered global
filters, optional tabs, and data widgets. Current active tab, filter values keyed by filter ID, and
drill-down state live under `ui.analytics`. The exact parser bounds the board to 32 filters, 16 tabs,
and 32 widgets in root or each tab, validates every View/custom-field reference and compatible filter
target, and rejects dashboard, panel, and filter-widget shapes.

An Analytics edit session deep-clones the complete configuration into one transient draft. Tab,
filter, widget, reorder, and query edits stay in that draft until one Save replaces the configuration
and reconciles the UI projection atomically. With no tabs, widgets belong to root. Creating the first
tab adopts all root widgets; deleting a tab moves its widgets to the next or previous tab, and
deleting the final tab returns them to root. Only root or the active tab mounts. Global filters stay
visible across tab changes and target every compatible widget by default or explicit widget IDs.
Visible data widgets submit current Employee, assignment, Tag-assignment, or Composite-record rows
to a bundled Worker. The Worker executes typed predicates, multi-value grouping, date buckets,
aggregations, sorting, Top N, tables, and pivots in bounded LRU result caches. Filter options are
requested only when their control opens. Result Employee IDs resolve the current virtualized
drill-down rather than retaining detached Employee objects.

Recharts 3 renders locally bundled responsive SVG with its accessibility layer. Widget and current
board-grid PNG export clones the settled local DOM through bundled `html-to-image`, excludes filters,
tabs, edit chrome, and action menus, retains a table's visible viewport, and applies the shared
8/32-megapixel and 16,384-pixel limits to its fixed 3× request.

The Editor omits the shared content header. A styled View selector plus Create, Rename, and Delete
actions occupy a top logical-start surface; the system View cannot be renamed or deleted. Search,
layout, Collapse/Expand, and full-View Image export occupy the top logical-end surface, with
Export retained for an empty View. Undo/Redo share the bottom logical-start surface with zoom and
focus, while the tools row is geometrically centered at the bottom and its single-selection
properties sit directly above it. All five surfaces share 48-pixel geometry, a 36-pixel control
height, six-pixel padding, background blur, and no border or shadow; compact layouts stack without
intersection. Logical side surfaces mirror around the LTR world in Arabic while the tool dock stays
centered. The
Editor keeps pointer and wheel previews outside the MobX structure document. The canvas uses
clipping rather than a browser scroll container, so navigation remains exclusively represented by
the View viewport. A transient viewport controller applies the latest pan or zoom sample directly to
the world transform, adaptive grid, inverse-scale interaction metrics, and isolated zoom label once
per animation frame. The large React scene observes only a 420-screen-pixel buffered render window;
it refreshes mounted membership when the visible rectangle leaves that window, the canvas resizes,
or navigation commits. Pointer release or wheel debounce performs the single viewport persistence
observation. Unit, connection, and canvas-element layers are memoized around stable indexed inputs,
so text drafts and unrelated gesture previews cannot invalidate stable cards. A geometry-keyed
spatial index limits Unit and connection rendering to the buffered world rectangle and is rebuilt
only when document geometry changes.

Text and Sticker DOM rendering share one runtime rich-text layout engine. It owns one lazy canvas
measurement context, a bounded 32,768-entry glyph-width LRU, weakly cached element layouts, and one
deduplicated loader per bundled font request. Auto-fit reuses authored glyph widths across fitting
passes. Active contenteditable input records exact insertion ranges when the browser supplies them,
falls back to complete-text comparison for other mutations, and coalesces draft publication through
one animation-frame scheduler. Plain long-text input keeps the browser-mutated text node instead of
replacing the complete span tree; completed edits still enter View history once.
Editor and PNG Employee summaries union each Unit's own IDs with all descendants. IDs repeated in
ancestors remain included in the current subtree; bosses follow ordinary deduplication. The shared
Units model's deepEmployeeIds union drives hierarchy selectors and export sources unchanged.
Layout direction has two independent pressed buttons. Every activation invokes one existing
undoable arrangement in that direction; two or more selected Units use selected-only layout and
zero or one selected Unit uses the complete hierarchy. No separate Arrange action renders.

Each Editor store also owns a bounded list of Units with distribution mode enabled. A memoized
active-View index maps each Employee ID to direct manual or resolved Live Unit IDs without treating
hierarchy containment as membership. Enabled source rows derive distributed or source-only tonal states from View colors in constant time. An exact single Employee occurrence derives a bounded
set of pointer-inert SVG paths from deterministic row rectangles; hidden rows in collapsed targets
fall back to the nearest card edge. The overlay sits above hierarchy paths and below cards, stays
outside history and spatial geometry, and is omitted from every Editor or Employee report output.
Editor PNG alone reuses the persistent row status and light tonal fill, but never this transient
overlay; JSON, Template, and Employee output remain distribution-neutral.
A second memoized index filters out distribution-enabled Units. Ordinary sources use this index for
placement action visibility, counts, and modal contents; enabled sources retain the complete index.
An open map closes when its source disappears or loses the Employee, or fewer than two eligible
placements remain. Membership and mode changes update both eligible discovery and open maps.
Its transient read-only modal lays only that Employee's Units on deterministic rings, offers bounded
pan/zoom/Fit controls, and delegates exact reveal, centering, and selection back to the Editor's
shared occurrence-navigation coordinator. The Unit context menu derives checked, unchecked, or
mixed state for the selected Unit set and persists one bounded UI update.
Unit, Employee, connection, and marquee drags share one edge-pan loop. After the movement threshold,
the last 64 screen pixels accelerate quadratically to a bounded six-pixel-per-frame viewport delta;
diagonal motion uses the same total cap. Drag and document-anchored marquee previews remain
transient, pointer release commits at most one viewport change and one structural command, and
cancel restores the gesture-start viewport.
Dragging an already selected Unit past the movement threshold preserves the whole selection.
Selected-only layout lays out the induced selected hierarchy, keeps its center, avoids unselected
bounds, and commits one snapped history operation without moving other Units. Expanded Unit cards
derive a catalog-ordered footer from direct Employees only; its wrapped chip geometry participates
in bounds, snapping, spatial indexing, connections, overlap resolution, and PNG output.

Every Unit deletion entry point uses the same organization coordinator. It deduplicates selected
ancestor and descendant closures, materializes surviving Live dependencies from their pre-delete
membership, removes the structure, and prunes Editor, system Unit, expanded, filter, and active
Download references before automatic persistence can observe the result. System selection falls
back to the nearest surviving ancestor, then the first root, then no selection.

The system View and Units are the same document. A custom View may start empty or clone any View;
copying regenerates all Unit IDs and View-local references while retaining global Employee IDs.
Editing an Employee or Tag updates every View immediately, while assigning or removing an Employee
from a custom Unit affects that View only. Unit Markdown notes follow the Unit through View cloning
and Copy/Paste but remain isolated after the copy. Editor export always uses the active View and
does not paint or serialize notes into Image, JSON, or Template output.

## Builds and development

`pnpm dev` starts the local server with webpack and warms `/` plus `/api/state`. `pnpm dev:check`
uses an isolated ignored database and Chromium to verify the root application, state API, local-only
requests, and Editor canvas. `pnpm build` produces the server build.

The development launcher observes child completion immediately after spawn. Startup probes and the
settling delay abort on child exit, interruption, or the 90-second startup deadline, so a stopped
server cannot be announced as ready. Running exits retain the child's numeric status; Ctrl+C and
SIGTERM stop the owned child cleanly with bounded escalation. Shared completion and canceled timers
prevent missed exit events and unsettled top-level awaits. Unit coverage runs the real launcher
against isolated synthetic loopback subprocesses; the development check also verifies actual Next.js.

`pnpm dev-stop` discovers existing development process trees for this checkout on macOS and Linux,
using `ps` plus canonical working directories (`lsof` on macOS, `/proc` on Linux). It matches the
launcher or exact Next.js entry with `dev`, covering both apps and arbitrary ports without a PID
registry. It signals outer roots gracefully, tracks their descendants through reparenting, and
rechecks PID, start time, and command before bounded escalation. Production commands and other
checkouts do not match. Generic workers already orphaned before discovery are not guessed to be dev
servers. Missing inspection tools, denied access, or surviving verified processes fail the command.

`pnpm pages:build` creates the ignored `pages-out` static application. `pnpm pages:check` requires
the `/org-tools` base path and rejects server chunks, SQLite symbols, database configuration, and
state API references. Publication is a separate guarded maintainer action.
