## Context

The Editor already keeps one `OrgEditorStore` per organization View. This isolates documents and history, but it also isolates clipboard state, so a copied organization fragment disappears when the active View changes. Unit footer Tags use separate fixed-height DOM and Canvas calculations that trim long labels. Drag previews are frame-coalesced for Unit movement and viewport pan, but other drag modes stop at the canvas boundary. Deletion mutates the structural document before durable UI references and dependent Live rules are sanitized, allowing the strict state writer to observe an invalid intermediate snapshot.

The change must preserve the current unversioned public state and the 20,000 Employee / 4,000 Unit interaction target. Server and browser-only runtimes must behave identically, and no transient interaction state may leave the current tab.

## Goals / Non-Goals

**Goals:**

- Share copied Unit fragments across Views while preserving target-View history isolation.
- Render complete Tag footer content with matching DOM, Canvas, and geometry measurements.
- Keep every supported Editor drag moving smoothly near canvas edges without per-frame durable writes.
- Make Unit deletion expose one strictly valid final state and remove all stale references.
- Preserve accessible View controls without redundant hover help.

**Non-Goals:**

- Changing `OrgToolsState`, SQLite, state API, Import, or Export contracts.
- Persisting or synchronizing clipboard contents between tabs.
- Publishing GitHub Pages manually.
- Adding compatibility readers, migrations, dependencies, or new gallery scenarios.

## Decisions

### One shared deterministic Tag footer layout

A pure layout helper will accept Tag summaries, available content width, and the existing typography constants. It will return chip rows, measured chip rectangles, label lines, and an indivisible count suffix. Words are preferred as wrap boundaries; overlong words, Arabic/CJK content, and emoji are split by grapheme cluster with a deterministic fallback. Short chips retain intrinsic width, while a long chip may use the complete footer width. DOM and Canvas renderers consume this result rather than independently truncating or measuring it.

The calculated footer height remains part of Unit bounds. Connections, spatial buckets, snapping, overlap avoidance, and PNG dimensions therefore continue to use a single geometry source.

### Clipboard ownership moves to the View collection

`OrgViewsStore` will own one transient clipboard payload for the current tab. An Editor store produces a self-contained copy payload; the active target Editor store consumes it and records one target history command. View switching and source-View deletion do not clear it, while full state replacement and Import do.

The payload records cloned Units, global Employee IDs, the source View ID, and resolved copy-time membership for every copied Unit. Paste always creates new Unit IDs and remaps copied parent and Live-Unit references. A same-View Live dependency may continue to point at an existing source Unit. During cross-View paste, any Live Unit with a dependency outside the copied closure is converted to a static Unit containing its recorded visible membership. Live Units with only global predicates or internal copied dependencies retain their rules. Employee IDs remain global and are filtered against the current catalog.

The clipboard is neither part of MobX serialization nor forwarded to SQLite, `BroadcastChannel`, the browser clipboard, or any network API.

### One rAF edge-pan controller for all drag modes

A pure velocity helper calculates a quadratic velocity inside a 64 px edge zone. Each axis starts at zero on the inner boundary and approaches 6 screen pixels per frame at the outer edge; diagonal magnitude is capped at 6. A single animation-frame loop merges pointer sampling, viewport preview, and mode-specific drag preview.

The loop starts only after the existing 4 px drag threshold for Unit, Employee, connection, and marquee gestures. Unit positions and the marquee origin remain in canvas coordinates, so a changing viewport does not detach them from the document. No organization or durable viewport state is written during the loop. Pointer release commits at most one viewport update and one structural command; cancellation restores the gesture-start viewport and discards transient previews.

### Deletion uses one coordinator and a valid snapshot boundary

All Unit deletion entry points call an organization-level coordinator. It first computes a deduplicated descendant closure and snapshots memberships and ancestor chains. Before the structural change becomes observable, remaining Live Units whose rules reference the deletion closure are materialized as static Units with their current direct membership. The coordinator then removes Units and atomically prunes Editor selections, system Unit selection/expansion/filter state, and active Download selections, filters, and exclusions.

For the system selection, fallback is the closest surviving ancestor captured before deletion, then the first surviving root, then `null`. Only after the complete organization and bounded UI projections pass strict validation does the coordinator notify automatic persistence. Undo restores the target View document through its existing history; pruned UI filters are not historical commands.

### View controls retain accessible names without visible tooltips

The shared icon-button component gains an explicit way to suppress both its custom tooltip and native `title`. View Select/Create/Rename/Delete use that mode while retaining localized `aria-label`, focus indication, disabled semantics, and the real Select popup.

## Risks / Trade-offs

- **[Wrapped footers increase Unit height]** → Use the shared measured layout everywhere Unit bounds are consumed and cover DOM/PNG parity with multilingual tests.
- **[Cross-View Live semantics can be ambiguous]** → Preserve rules only when all Unit dependencies can be resolved in the target; otherwise materialize the exact copy-time visible membership.
- **[Continuous edge-pan can generate excessive renders]** → Keep one owned rAF loop, update only transient viewport/drag state, and query visible geometry through the existing spatial index.
- **[Deletion touches several UI projections]** → Centralize cleanup, validate before notification, and test parent/child/multi-branch selections plus reload.
- **[Clipboard may reference globally deleted Employees]** → Sanitize Employee IDs and stored membership when the payload is pasted or global catalogs change.

## Migration Plan

No state or database migration is required. The implementation replaces only transient behavior and derived layout. Rollback is the repository commit because persisted data remains on the existing schema.

## Open Questions

None.
