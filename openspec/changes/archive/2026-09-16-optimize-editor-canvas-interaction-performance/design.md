## Context

The Editor currently stores its RAF-coalesced viewport and rich-text draft in the same large React
observer that derives the complete visible scene. A viewport sample therefore re-renders Unit cards,
canvas annotations, connections, and toolbars. Rich Text and Sticker rendering independently create
measurement canvases and recompute grapheme layout; contenteditable input also copies and compares
the complete text through the parent component. Spatial culling bounds the mounted scene but its
query still changes for every viewport sample.

The existing State, rendering order, anchor graph, history, local-only privacy model, DOM/PNG
parity, and maintained 20,000 Employee / 4,000 Unit target constrain the optimization. The solution
must work identically in the loopback server and static Pages runtimes without a new dependency.

## Goals / Non-Goals

**Goals:**

- Keep pan and zoom on a compositor-friendly imperative transform without re-rendering the complete
  React scene per frame.
- Bound scene-membership updates through a buffered render window while preserving complete visible
  content.
- Cache rich-text metrics and layouts across unrelated interactions and centralize font readiness.
- Keep active rich-text input and selection local to the editor surface and commit once.
- Add deterministic invalidation diagnostics plus timing coverage for a large annotated View.

**Non-Goals:**

- Changing the public State shape, UI, export options, or saved document semantics.
- Rasterizing or simplifying Units or annotations while interacting.
- Moving organization data to a worker, remote service, browser storage, or telemetry system.
- Changing PNG geometry or accepting a lower visual-fidelity mode.

## Decisions

### Use an imperative viewport controller with a buffered render window

One local controller owns the live viewport ref and writes the world transform, grid styles,
inverse-zoom metrics, and diagnostic attributes once per animation frame. Pointer coordinate logic
continues to read the same live ref. The durable MobX viewport changes only after release or wheel
idle. A small zoom-label subscriber is isolated from the scene.

The controller maintains a render window equal to the visible world rect plus the existing 420
screen-pixel overscan. Mounted membership changes only when the visible rect is no longer contained
by that window, the canvas resizes, or a viewport gesture commits. Zoom-in may retain excess
offscreen nodes until commit; zoom-out refreshes before visible content leaves the window. This
avoids blank frames without reducing content.

The alternative of keeping the viewport in the parent React state preserves simpler data flow but
continues invalidating every scene node and is rejected.

### Isolate scene layers and transient previews

Connections, Units, each canvas-element plane, and interaction overlays become memoized layers.
Stable callbacks and per-node booleans replace render-created callbacks and global selection sets.
Transient gesture data lives in a local controller with keyed subscriptions so only selected Units,
selected elements, dependent attached elements, and the relevant overlay observe pointer samples.

Committed geometry is indexed by ID. Spatial buckets and dependency maps update changed IDs and the
dependent closure rather than rebuilding unrelated bounds. Employee-row and Unit-footer geometry is
derived outside React rendering; no cache setter runs inside `useMemo`.

### Share bounded rich-text measurement and layout

A per-document layout engine owns one measurement canvas, a 32,768-entry least-recently-used width
cache, font readiness generations, and layouts keyed by element ID plus layout revision. Geometry-
only changes do not advance the layout revision. Prepared grapheme/style metrics are reused by the
bounded fitting passes. The existing pure layout function remains the canonical cold path and PNG
uses the same layout stages.

One font coordinator loads each distinct local request once and invalidates only Text or Sticker
elements referencing a font whose readiness generation changed. This replaces per-element font
effects and full-document normalization after unrelated renders.

### Keep contenteditable state local and incremental

The active editor owns text, format runs, selection, pending typography, and a monotonic draft
revision. `beforeinput`, paste, and composition provide the changed UTF-16 range; unsupported DOM
mutations fall back to the current complete-text comparison. A text-node offset index replaces
root-wide `Range.toString()` scans. Draft layout is latest-value RAF-coalesced and reuses unchanged
prepared metrics. Only changed spans are patched, while toolbar controls subscribe to the draft
rather than the complete scene. Finish, blur, Escape, or tool changes remain idempotent and issue
one durable command.

### Validate both structural invalidation and elapsed time

Opt-in local test diagnostics expose bounded numeric counters only. They never include organization
content, persist data, or send requests. Browser tests use deterministic counters as the primary
regression signal and enforce coarse frame/input budgets after warm-up to catch blocking work.

## Risks / Trade-offs

- **Buffered culling can temporarily retain extra nodes during zoom-in** → refresh on commit and
  keep the existing bounded overscan; never omit visible nodes.
- **Imperative transforms can diverge from React state** → use one controller for DOM writes,
  coordinate conversion, commit, cancellation, and external viewport synchronization.
- **Cached font metrics can become stale** → include the per-font readiness generation and clear
  affected layout entries when local fonts finish loading.
- **Incremental contenteditable events vary by browser** → retain the existing full-text fallback
  and cross-check incremental output against the cold formatter in unit tests.
- **Wall-clock browser assertions can be noisy** → make deterministic render/layout counters the
  primary gate and use tolerant p95/max timing limits only after warm-up.

## Migration Plan

No State or SQLite migration is required. The change is an internal rendering refactor and can be
reverted as one commit without converting saved data.

## Open Questions

None.
