# Performance

The maintained target is 20,000 Employees and 4,000 Units on a modern desktop browser.

## State and persistence

Organization and durable UI observations are separate. UI-only actions serialize only bounded
scalars, filters, active View, and per-View selection/viewport. They never traverse the Employee
catalog, View Unit graphs, Live rules, or editor documents. Text input is coalesced by the 300 ms UI delay. Organization
snapshots are created for logical organization actions and are kept behind a single-flight write
queue; a newer pending snapshot replaces an older pending snapshot.

SQLite stores organization and UI JSON separately in one row. Prepared statements and one immediate
transaction keep each update atomic. A bounded retry does not create parallel writes. The static
runtime broadcasts only after logical store changes and does not serialize organization data for
theme, locale, tab, filter, search, viewport, or selection changes.

## Indexing and rendering

- Persist identifiers and relationships rather than nested Employee copies.
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
- Cache derived structures by View document revision and global Employee/Tag/field references.
  Materialize only the system View, active Editor View, and selected Download View at once.
- Virtualize Employee lists, Unit-aware pickers, filter options, Analytics rows, and event dialogs.
- Flatten the selected-Unit direct and descendant result groups once before rendering them through
  the ordinary Employee virtualizer; do not create virtual header rows or repeat count formatting.
- Coalesce pan, zoom, and Unit, Employee, connection, or marquee drag samples through one
  latest-value animation-frame scheduler. Edge-pan uses only the sampled pointer and canvas bounds;
  it never walks the Unit collection per frame.
- Keep viewport, Unit, connection, drop-target, and document-anchored marquee deltas in transient
  render previews; write the MobX document once after pointer release or wheel debounce, then run
  snapping, overlap resolution, history, and persistence. Cancellation restores the starting
  viewport without a durable write.
- Query visible Unit and connection candidates through a geometry-keyed spatial index that is not
  rebuilt for pointer samples.
- Paint the adaptive Editor grid as a constant-cost CSS background and snap coordinate-producing
  commands to the 24-unit document grid. Direct-Employee Tag summaries are indexed per materialized
  View; a deterministic glyph-aware width packs intrinsic short chips and grapheme-safe long lines,
  and the cached wrapped footer heights participate in the same geometry pass without DOM
measurement. DOM and PNG consume the same line rectangles and indivisible count suffix.
- Keep the Unit Markdown renderer out of the main Editor bundle and mount it only while a note
  Preview is open. Closed notes are opaque bounded strings: canvas layout, spatial indexing, search,
  PNG painting, and Employee output never parse them. Editing mutates only a transient draft; Save
  validates at most 64 KiB of UTF-8 and commits one Unit document change.

Analytics builds every count group, known birth-year index, and gender age cohort in one Employee
pass per organization revision; UI-only changes reuse the result. Its drill-down stores stable keys
rather than detached Employee arrays. Analytics uses bounded virtualized groups. Calendar uses seven fluid columns, a constant-size Tag
indicator per date, and virtualized event dialogs. Editor Employee rows and PNG output use the same deterministic tag
packing, variable row heights, and prefix geometry. Image export measures each included tag once
with the loaded output font, retains complete multi-line chip layouts, and builds one immutable
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
128 KiB, and builds complete JSON or Template output in yielding batches only for Copy or Download.
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
complete locally measured tag text, resolved Tag colors, and local vector primitives without network work. Oversized tags
increase only their Employee row and containing Unit height; the existing maximum canvas-pixel bound
remains authoritative.

Avatar input is bounded to 25 MiB compressed and 40 megapixels decoded. The crop preview is capped at
4096 pixels on its longest side; confirmation creates one 512 by 512 image, preferring WebP and
retrying local PNG only when necessary, then releases temporary object URLs. The final embedded data
URL remains subject to the 2 MiB avatar limit.

Generate the maintained large fixture outside the repository with `pnpm fixture:performance`. Test
search, filters, Unit navigation, canvas selection, State and Employee Import, automatic SQLite writes,
tab synchronization, Export, and UI-only updates. Treat blocking interaction, unbounded duplication,
per-row network work, organization serialization during UI-only actions, or full Unit scans during
pointer previews as regressions. The browser suite exercises 20,000 Employees and 4,000 Units,
requires bounded spatial candidates, observes no state write during preview, and allows one final
write for each completed pan or structural drag. The shared cross-View clipboard stores only the
copied closure and resolved membership in current-tab memory, is sanitized on catalog changes, and
is cleared on complete state replacement. Atomic Unit deletion computes its closure and dependent
Live materialization once before exposing the valid final state to persistence.
