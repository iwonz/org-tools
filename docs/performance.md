# Performance

The maintained target is 20,000 Employees and 4,000 Units on a modern desktop browser.

## State and persistence

Organization and durable UI observations are separate. UI-only actions serialize only bounded
scalars, filters, View IDs, selection, and viewport. They never traverse the Employee catalog, Unit
graph, Live rules, or editor documents. Text input is coalesced by the 300 ms UI delay. Organization
snapshots are created for logical organization actions and are kept behind a single-flight write
queue; a newer pending snapshot replaces an older pending snapshot.

SQLite stores organization and UI JSON separately in one row. Prepared statements and one immediate
transaction keep each update atomic. A bounded retry does not create parallel writes. The static
runtime broadcasts only after logical store changes and does not serialize organization data for
theme, locale, tab, filter, search, viewport, or selection changes.

MCP read tools reuse the validated state and derived View structures until the SQLite revision
changes. Every collection page is capped at 100 records, avatar bytes are opt-in, and reads never
serialize a new full state snapshot. Preview validates one detached result; Apply performs one
organization serialization and one SQLite transaction. Applied preview snapshots are compacted, and
history is pruned to 100 changes and 64 MiB. A revision event contains only a revision and source.
Changing the selected MCP client or rebuilding its short setup prompt operates only on the endpoint,
token, and bundled templates; it never reads or serializes organization state.

## Indexing and rendering

- Persist identifiers and relationships rather than nested Employee copies.
- Build shared maps, search documents, Unit order, membership, birthday, gender, dated-tag,
  position, and tag indexes outside React render paths.
- Build expensive structures lazily for Main and the active or selected View.
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

Analytics uses bounded virtualized groups. Calendar uses seven fluid columns, bounded inline events,
and virtualized event dialogs. Editor Employee rows and PNG output use the same deterministic tag
packing, variable row heights, and prefix geometry. Image export measures each included tag once
with the loaded output font, retains complete multi-line chip layouts, and builds one immutable
render entry per included Unit before painting cards and connections without measuring mounted or
virtualized DOM.

## Import and output

Import reads at most 25 MiB, parses one detached complete state, validates references in indexed
passes, and computes only Employee, Unit, and View counts before confirmation. Export serializes one
validated current state after the explicit action. Data Download derives only selected sources.
Canvas PNG generation uses current layout, shared live-card geometry, bounded embedded avatar bytes,
complete locally measured tag text, and local vector primitives without network work. Oversized tags
increase only their Employee row and containing Unit height; the existing maximum canvas-pixel bound
remains authoritative.

Avatar input is bounded to 25 MiB compressed and 40 megapixels decoded. The crop preview is capped at
4096 pixels on its longest side; confirmation creates one 512 by 512 image, preferring WebP and
retrying local PNG only when necessary, then releases temporary object URLs. The final embedded data
URL remains subject to the 2 MiB avatar limit.

Generate the maintained large fixture outside the repository with `pnpm fixture:performance`. Test
search, filters, Unit navigation, View switching, canvas selection, Import, automatic SQLite writes,
MCP pagination/read caching/Preview/Apply, tab synchronization, Export, and UI-only updates. Treat
blocking interaction, unbounded duplication,
per-row network work, organization serialization during UI-only actions, or full Unit scans during
pointer previews as regressions. The browser suite exercises 20,000 Employees and 4,000 Units,
requires bounded spatial candidates, observes no state write during preview, and allows one final
write for each completed pan or Unit drag.
