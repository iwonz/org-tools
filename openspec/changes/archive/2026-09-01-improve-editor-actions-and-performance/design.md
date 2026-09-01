## Context

The shell currently renders a title-only context header while Teams, Employees, and Download own
their primary actions inside workflow panels. The Editor writes observable viewport and Unit arrays
on every raw pointer event. Those writes invalidate full-array visibility and connection passes and,
for Unit drag, repeat snapping and overlap work before the gesture has finished. Selected Team cards
also use an alpha accent fill even though passive Team hover was already made visually stable.

The implementation must serve both the SQLite runtime and browser-only Pages, preserve the exact
public state and APIs, keep MCP server-only, and retain the 20,000 Employee / 4,000 Unit target.

## Goals / Non-Goals

**Goals:**

- Give key workflows one responsive action in the shared context header without render-phase state
  updates.
- Keep selected Team cards opaque and make Editor controls visually consistent.
- Make pan, wheel zoom, and Unit drag frame-bounded while committing durable state once per gesture.
- Keep viewport culling proportional to nearby geometry instead of the complete Unit collection.
- Preserve strict local-only behavior and deterministic browser/screenshot coverage.

**Non-Goals:**

- Changing `OrgToolsState`, SQLite tables, HTTP endpoints, MCP tools, or token semantics.
- Adding icons mechanically to every dialog button, menu row, or tab.
- Replacing the Editor layout engine, connection routing, 24-unit snap system, or export geometry.
- Publishing GitHub Pages as part of this change.

## Decisions

### Register one header action after render

The shell will expose a small internal header-action context. An active workflow registers one
descriptor from an effect and unregisters it on unmount. The shell owns rendering, responsive text,
tooltip, and geometry; the workflow retains its dialog or step callback. This avoids moving dialog
state into the global store and avoids updating the shell while a child is rendering.

Only Teams, Employees, and Download register actions. Their text is visible on ordinary widths and
the thematic icon remains as an accessible icon-only action at narrow widths. Existing internal and
empty-state duplicates are removed.

### Keep selection semantic but surface-stable

Team nodes keep the opaque card background for resting, hover, and selected states. Selection only
changes the existing one-pixel semantic border color. Drop targets remain a distinct transient
interaction state. The shared Select trigger is used without the toolbar overrides that removed its
normal surface and indicator. Text-bearing Editor toolbar commands opt into normal font weight and
place their icons after their labels.

Search results are rendered only for a non-empty query. Closing Search atomically closes the control
and clears the query, so accidental text is not retained after the workflow ends. The public UI
shape remains unchanged.

### Separate gesture preview from durable state

A frame scheduler retains only the latest pointer or wheel sample and applies at most one preview
per animation frame. Pan and wheel zoom update a transient viewport used by the canvas transform,
grid, and culling; the MobX viewport changes once on pointer release or after a short wheel quiet
period. Unit drag updates transient positions for the selected Units and affected connections; it
does not replace `editor.units`, run overlap avoidance, create history, or schedule persistence until
pointer release. Release performs the existing snap and overlap calculation once and records one
command.

Cancellation restores the committed viewport or Unit positions. Pending frames and wheel timers are
cancelled on unmount. Discrete zoom and arrange commands remain single immediate commits.

### Index stable geometry for viewport queries

The Editor builds a memoized uniform spatial index from Unit bounds when document geometry changes.
Viewport queries visit intersecting cells and deduplicate IDs; affected drag Units are pinned during
preview. Visible connections are derived from indexed visible endpoints plus connections whose
bounds intersect the viewport. Employee row virtualization continues to receive the transient world
rectangle.

This removes the 4,000-Unit scan from each frame without introducing a dependency or changing state.

## Risks / Trade-offs

- [A header action briefly registers after mount] -> Use a layout effect and reserve the action area
  so the 64 px header does not shift.
- [A fast pan reaches geometry outside the previous overscan] -> Query the spatial index from the
  current transient viewport every rendered frame.
- [Interrupted gestures leave preview styles] -> Centralize cleanup and always restore from the
  committed snapshot on cancel, lost capture, or unmount.
- [Wheel input produces excessive persistence] -> Keep one trailing commit timer and replace its
  pending viewport with the latest sample.
- [Spatial buckets become stale] -> Key index construction to the immutable Unit geometry input and
  cover moves, collapse, arrange, and layout changes with correctness tests.

## Migration Plan

No data migration exists. Deploy both runtimes from the same commit. Existing state, databases, and
MCP settings load unchanged; rollback restores the previous renderer without transforming data.

## Open Questions

None.
