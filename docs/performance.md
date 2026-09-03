# Performance

The maintained target is 20,000 Employees and 4,000 Units on a modern desktop browser.

## State and persistence

Organization and durable UI observations are separate. UI-only actions serialize only bounded
scalars, filters, selection, and viewport. They never traverse the Employee catalog, Unit graph,
Live rules, or editor document. Text input is coalesced by the 300 ms UI delay. Organization
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
- Parse each canonical `DD.MM.YYYY` birthday once while building the shared search index; Calendar,
  Analytics, and filters reuse its derived recurring month-day key without duplicating Employee data.
- Resolve custom Template dependencies once per definition graph and memoize derived Employee
  values by organization revision. Filter option discovery and output reuse the same cache.
- Build the current derived structure once per organization change and reuse its indexes.
- Virtualize Employee lists, Unit-aware pickers, filter options, Analytics rows, and event dialogs.
- Flatten the selected-Unit direct and descendant result groups once before rendering them through
  the ordinary Employee virtualizer; do not create virtual header rows or repeat count formatting.
- Coalesce pan, zoom, and Unit-drag samples through one latest-value animation-frame scheduler.
- Keep viewport and Unit deltas in transient render previews; write the MobX document once after
  pointer release or wheel debounce, then run snapping, overlap resolution, history, and persistence.
- Query visible Unit and connection candidates through a geometry-keyed spatial index that is not
  rebuilt for pointer samples.
- Paint the adaptive Editor grid as a constant-cost CSS background and snap coordinate-producing
  commands to the 24-unit document grid.

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
action. Data Download derives only selected sources, caps preview work at 50 records or rows and
128 KiB, and builds complete JSON or Template output in yielding batches only for Copy or Download.
The source and selected panes retain equal width on desktop and equal height on narrow screens; their
geometry does not depend on the current source tab. Template token filtering uses the bounded
built-in plus custom-field catalog and never serializes organization data.
Dragging a scalar, Unit, Tag, or nested collection field changes only its bounded order array and
rebuilds the bounded preview once per completed drop. Unit and Tag exclusions use normalized `Set`
lookups; searchable selectors virtualize their options and show only an exclusion count in the
trigger.
Canvas PNG generation uses current layout, shared live-card geometry, bounded embedded avatar bytes,
complete locally measured tag text, and local vector primitives without network work. Oversized tags
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
write for each completed pan or Unit drag.
