# Performance

The maintained target is 20,000 Employees and 4,000 Units on a modern desktop browser.

## State and persistence

Organization and durable UI observations are separate. UI-only actions serialize only bounded
scalars, filters, active View, and per-View selection, viewport, and distribution Unit IDs. They
never traverse the Employee
catalog, View Unit graphs, Live rules, or editor documents. Text input is coalesced by the 300 ms UI delay. Organization
snapshots are created for logical organization actions and are kept behind a single-flight write
queue; a newer pending snapshot replaces an older pending snapshot.

SQLite stores organization and UI JSON separately in one row. Prepared statements and one immediate
transaction keep each update atomic. A bounded retry does not create parallel writes. The static
runtime broadcasts only after logical store changes and does not serialize organization data for
theme, locale, tab, filter, search, viewport, or selection changes.

## Indexing and rendering

- Persist identifiers and relationships rather than nested Employee copies.
- Build catalog Tag ranks once per derived model and resolve each Employee's ordered Tags and earliest
  rank outside rendering and comparator calls. View grouping reads that cached scalar and shares its
  final row order with PNG, prefix geometry, and distribution anchors. Catalog drag previews never
  rebuild Employees or Views; a completed drop commits one global change.
- Build shared maps, search documents, Unit order, membership, birthday, gender, dated-tag,
  position, Tag-catalog, and custom-field indexes outside React render paths.
- Derive custom Tag tonal variables from one six- or eight-digit HEX value when its surface renders;
  palette and hue movement update only the open Tag draft in constant time; one final valid commit
  updates the catalog after the gesture. Exact input commits only on Enter or blur. These previews never traverse
  Employees or Units.
- Parse each canonical `DD.MM.YYYY` birthday once while building the shared search index; Calendar,
  Analytics, and filters reuse its derived recurring month-day key without duplicating Employee data.
- Resolve custom Template dependencies once per definition graph and memoize derived Employee
  values by organization revision. Filter option discovery and output reuse the same cache.
  Multi-option filters reuse resolved label arrays, Composite filters reuse only indexed primary
  values, and Composite Calendar dates are flattened once during the same organization-index build.
- Resolve each mounted Employee card from one saved contextual format and already indexed Unit
  contexts. Format output is bounded by the persisted format and field values, drops dynamically
  empty lines, preserves only authored internal blank rows,
  and does not add catalog scans. A 256-entry least-recently-used cache stores parsed Markdown trees
  by the resolved template structure without retaining organization values. Native Tag and compound
  assignment nodes reuse bounded chip packing based on the complete `Position · Unit` projection.
  A weakly owned cache keeps at most eight width, locale, direction, text-mode, and font variants for
  one resolved rich-line source. Cached results retain both ordered format blocks and their flattened
  global child-row coordinates without a second DOM or Canvas layout pass. One bounded 32,768-entry Canvas cache measures the actual family,
  size, weight, style, and text and clears after bundled fonts load. The shared word/grapheme packer
  stays linear in output size.
  Editor computes one rich fragment layout per row and passes it to DOM rendering, geometry, and
  PNG. The configured outer block gaps and native semantic continuation gaps feed the existing
  prefix-offset pass, so formatted cards preserve O(n) geometry work.
- Cache derived structures by View document revision and global Employee/Tag/field references.
  Materialize only the system View, active Editor View, and selected Download View at once.
- Build the active View's direct `EmployeeId → UnitId[]` distribution index only when materialized
  manual or Live membership changes. Derive ordinary-only placements from that index and enabled
  Unit IDs, outside Employee rendering. Mode changes invalidate only the filtered index. Row status
  is an indexed lookup; selecting one Employee walks only that Employee's assignments and derives virtualized-row or collapsed-card anchors without a
  full Unit scan. The read-only placement map consumes only that indexed assignment list, uses a
  deterministic bounded ring layout, and keeps pan/zoom outside state. Image export receives the
  same complete memoized index and enabled-Unit set, so Unit-only and subtree status remains correct
  without rebuilding or rescanning the active View for each preview.
- Virtualize discriminated Employee/open-position Unit rows, Unit-aware pickers, filter options,
  Analytics rows, and event dialogs. Stable row keys share cached rich-line heights and prefix
  offsets. The prefix sum includes one four-pixel gap before every row after the first, so DOM,
  virtual windows, hit testing, anchors, Unit bounds, hierarchy placement, and PNG reuse one O(n)
  geometry pass without per-row margins or measurements. Open-position anchor and drop hit testing
  resolves one indexed row instead of scanning a
  roster. An optional open-position background is one O(1) tonal-style lookup on an already-mounted
  row and adds no geometry invalidation, scan, index, or subscription; Employee-only projections
  continue to consume the existing assignment indexes.
- Tag-filter search preserves the catalog array order and normalizes labels for matching. Its
  virtualized visible result derives from a deferred transient query; search-scoped bulk selection
  emits one filter update and never depends on mounted rows.
- Flatten the selected-Unit direct and descendant result groups once before rendering them through
  the ordinary Employee virtualizer; do not create virtual header rows or repeat count formatting.
- Coalesce pan, zoom, and Unit, Employee, connection, or marquee drag samples through latest-value
  animation-frame schedulers. Pan and zoom write the world transform, adaptive grid, inverse-scale
  control metrics, and isolated zoom label directly; they do not set React state for the complete
  scene. Edge-pan uses only the sampled pointer and canvas bounds and never walks the Unit collection
  per frame.
- Keep viewport, Unit, connection, drop-target, and document-anchored marquee deltas in transient
  render previews; write the MobX document once after pointer release or wheel debounce, then run
  snapping, overlap resolution, history, and persistence. Cancellation restores the starting
  viewport without a durable write.
- Query visible Unit and connection candidates through a geometry-keyed spatial index that is not
  rebuilt for pointer samples. Mounted membership uses a stable world rectangle with 420 screen
  pixels of overscan and refreshes only before the visible viewport exits that rectangle, after a
  canvas resize, or at viewport commit. Zoom-in may retain bounded extra nodes until commit but no
  visible content is omitted. Memoized connection, Unit, and canvas-element nodes receive stable
  indexed inputs; a gesture re-renders only selected owners, attachment dependents, and overlays.
- Index committed canvas-element bounds and forward/reverse anchor dependencies beside Unit bounds.
  Snap gestures query only nearby Unit/element cells, derive Employee or open-position candidates from cached row
  offsets, and update only the affected dependency closure. Move, resize, rotation, endpoint,
  Bezier, anchor, and text drafts use the latest-value frame scheduler; only pointer release or edit
  completion mutates the View document once. Four visible corner handles, four transparent side
  strips, and four transparent corner-rotation targets are constant per selected frame and use
  inverse-zoom CSS metrics without rebuilding geometry. Rectangle resize resolves one local-axis
  bounds calculation plus bounded integer-dimension normalization; rotation reads one cached
  selected-bounds center per pointer sample without scanning Units or canvas elements. Resting
  connector markers stay hidden. Arrow-tool hover and attachment drag query only nearby indexed
  owners plus cached Employee-row offsets, then paint one owner outline and its bounded complete
  anchor set while emphasizing the nearest candidate.
- Paint the adaptive Editor grid as a constant-cost CSS background and snap coordinate-producing
  commands to the 24-unit document grid. Direct-Employee Tag summaries are indexed per materialized
  View; actual cached local-font widths pack intrinsic short Tag fragments and grapheme-safe long
  labels, and the cached wrapped footer heights participate in the same geometry pass without DOM
measurement. DOM and PNG consume the same content-sized fragment rectangles, 6 px row/column gaps,
and indivisible date or count suffix. Disabling the View Tag
  cloud sets every footer height to zero, including cached geometry. Distribution color drafts stay
  local to the open picker; shared light/dark/canvas tonal values are derived from one color
  calculation, and each included PNG row performs only indexed status and cached-color lookups.
- Resolve Editor annotation typography through five bounded local stacks before DOM measurement or
  PNG painting. One lazy measurement canvas and a 32,768-entry LRU cache each distinct local
  font/grapheme width; unchanged element objects reuse a weakly held completed layout. Text and
  Sticker scan graphemes and normalized format runs linearly, prefer word breaks with grapheme
  fallback, and reuse authored glyph widths across effective-scale fitting passes. Local font
  requests are deduplicated and invalidate the layout engine only when a newly requested bundled
  font becomes ready. Active input records direct replacement ranges where available, coalesces the
  latest draft through RAF, and retains the browser-mutated node for single-style long text instead
  of rebuilding the span tree. The canonical cold layout remains shared with PNG. Bounded fitting
  keeps Text no lower than the 8 px floor; every rectangle and group frame retains four side targets.
  Arrow endpoint updates project two controls in constant time through cached chord coordinates.
  Legacy family names and weight 500 collapse to System/Regular without remote work.
- Keep the Unit Markdown renderer out of the main Editor bundle and mount it only while a note
  Preview is open. Closed notes are opaque bounded strings: canvas layout, spatial indexing, search,
  PNG painting, and Employee output never parse them. Editing mutates only a transient draft; Save
  validates at most 64 KiB of UTF-8 and commits one Unit document change.

Analytics builds every count group, known birth-year index, and gender age cohort in one Employee
pass per organization revision; UI-only changes reuse the result. Its drill-down stores stable keys
rather than detached Employee arrays. Analytics uses bounded virtualized groups. Calendar uses seven fluid columns, a constant-size Tag
indicator per date, and virtualized event dialogs. Editor Employee rows and PNG output use the same
display-line heights and prefix geometry. Mounted list cards measure their information-column width
with `ResizeObserver` and reuse the same bounded layout cache; font readiness, width, locale,
direction, content, or fixed image font invalidates the applicable measurements and virtual rows
remeasure only after the resolved height changes. Focused Display setters skip identical values, while the existing latest-
snapshot writer coalesces valid keystroke updates. Open-position rows continue to use deterministic Tag
packing. Image export measures each included open-position Tag once
with the system UI output font, retains complete multi-line chip layouts, and builds one immutable
render entry per included Unit before painting cards and connections without measuring mounted or
virtualized DOM.

## Import and output

Import reads at most 25 MiB. State mode parses one detached complete state and validates references
in indexed passes. Employee mode discovers the union of mappable paths and the first richest record
in one O(n) pass, renders at most 128 KiB of that record, validates UUID and identity indexes plus
canonical complete birthdays in the same pass, keeps per-row overrides sparse, and virtualizes the
three review columns. Pending custom Value definitions remain bounded metadata and are committed only
with a successful atomic Apply. Global Export computes only the complete state after the explicit
action. Data Download derives only the selected View/source, caps preview work at 50 records or rows and
128 KiB, and streams rendered Template fragments through one exact logical-line filter. Its bounded
Set preserves the first unique line across asynchronous batches; complete JSON or Template output is
built in yielding batches only for Copy or Download.
The source and selected panes retain equal width on desktop and equal height on narrow screens; their
geometry does not depend on the current source tab. Template token filtering uses the bounded
built-in plus custom-field catalog and never serializes organization data.
Dragging a scalar, Unit, Tag, or nested collection field changes only its bounded order array and
rebuilds the bounded preview once per completed drop. Unit and Tag exclusions use normalized `Set`
lookups; searchable selectors virtualize their options and show only an exclusion count in the
trigger.
Employee Import discovers source paths and its richest representative once. The source-driven mapping
list virtualizes visible rows, keeps unique targets in a bounded map, and never repeats the 20,000-row
analysis while scrolling or changing a target.
Canvas PNG generation uses current layout, shared live-card geometry, bounded embedded avatar bytes,
complete locally measured tag text, resolved local font stacks, Tag colors, and vector primitives
without network work. Oversized tags
increase only their Employee row and containing Unit height; the existing maximum canvas-pixel bound
remains authoritative.
The shared image scene computes rotated rectangle and cubic Bezier bounds once, then paints hierarchy
connections, `behindUnits`, cards, and `aboveUnits` in stable order. Preview and final output reuse the
same fixed-requested-3× plan; only effective raster density changes under the 8- and 32-megapixel plus maximum-side
limits. Each dialog transforms one preview image inside a ResizeObserver-bounded viewport; wheel,
pointer, button, and keyboard navigation update only constant-size transient geometry, while preview
regeneration preserves one normalized focal point without repainting organization data. Embedded
canvas Images retain source bytes and decode with bounded concurrency.

Avatar input is bounded to 25 MiB compressed and 40 megapixels decoded. The crop preview is capped at
4096 pixels on its longest side; confirmation creates one 512 by 512 image, preferring WebP and
retrying local PNG only when necessary, then releases temporary object URLs. The final embedded data
URL remains subject to the 2 MiB avatar limit.

Generate the maintained large fixture outside the repository with `pnpm fixture:performance`. Test
search, filters, Unit navigation, canvas selection, State and Employee Import, automatic SQLite writes,
tab synchronization, Export, and UI-only updates. Treat blocking interaction, unbounded duplication,
per-row network work, organization serialization during UI-only actions, or full Unit scans during
pointer previews as regressions. The browser suite exercises 20,000 Employees, 4,000 expanded
Units, 1,200 Text/Sticker/Arrow annotations, attachments, and a 60,000-character Text. Opt-in local
numeric diagnostics verify that a buffered pan performs no stable Unit, annotation, or rich-text
render work. After warm-up the scenario gates p95 frame intervals at 33 ms, individual gaps at 100
ms, and p95 long-text input-to-next-frame latency at 50 ms. Diagnostics never contain organization
content and are neither persisted nor transmitted. The suite also requires bounded spatial
candidates, observes no state write during preview, and allows one final write for each completed
pan or structural drag. The shared cross-View clipboard stores only the
copied closure and resolved membership in current-tab memory, is sanitized on catalog changes, and
is cleared on complete state replacement. Atomic Unit deletion computes its closure and dependent
Live materialization once before exposing the valid final state to persistence.

Tag sorting measures row slots once at gesture start and coalesces pointer movement and bounded
list scrolling with requestAnimationFrame. Transforms never feed collision measurements. Edge
scrolling stops only at the actual boundary, not on a short frame rounded to zero pixels. Preview
does not write the catalog or rebuild derived models; one successful release invokes moveTag.
Subtree counts are memoized with materialized membership and hierarchy, independent of viewport,
search, collapse, Tag grouping, and distribution mode. Each total includes its own direct members.
