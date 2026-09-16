## Why

Large Editor Views can drop interaction frames because transient pan, zoom, and rich-text edits
invalidate the monolithic React scene. Long Text and Sticker content also repeats font measurement
and layout work even when only the viewport changes. The Editor needs stable interactive
performance at its maintained 20,000 Employee and 4,000 Unit scale without hiding content or
removing behavior.

## What Changes

- Isolate transient viewport and gesture previews from durable MobX state and from unrelated React
  scene nodes.
- Keep a buffered render window so spatial queries and mounted scene membership do not change on
  every pan or zoom sample.
- Memoize Unit, connection, and canvas-element layers and update only directly affected dependency
  closures during gestures.
- Add a bounded shared rich-text measurement and layout engine, centralize local font loading, and
  keep active contenteditable drafts local to the editing surface.
- Add deterministic local performance diagnostics and stress coverage for large expanded
  structures, canvas annotations, and maximum-size rich text in server and Pages runtimes.
- Preserve the exact State shape, all Editor interactions, DOM/PNG presentation, local-only privacy,
  history semantics, and export behavior.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `organization-editor`: Strengthen the interaction-performance contract for buffered viewport
  rendering, isolated transient updates, cached rich-text layout, and large annotated Views.

## Impact

The Editor canvas React composition, spatial scene indexes, transient interaction state, rich-text
layout and font coordination, and browser performance tests change. Architecture and performance
documentation are updated. There are no new runtime dependencies, network requests, localized
strings, State fields, migrations, or export-format changes.
