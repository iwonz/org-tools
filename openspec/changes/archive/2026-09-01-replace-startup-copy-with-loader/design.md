## Context

`StateRuntimeController` renders one shared startup state while the SQLite runtime loads its
singleton row and while Pages resolves the initial live-tab handshake. It currently presents a
database icon plus visible state-reading copy. The transition is short, contains no actionable
information, and is shared by both runtimes.

## Goals / Non-Goals

**Goals:**

- Render one visually centered, icon-only loader on the normal shell background.
- Keep assistive status semantics and a localized accessible name without visible copy.
- Respect reduced-motion preferences and reuse existing semantic color tokens.
- Verify the transient state deterministically by delaying the state transport in a browser test.

**Non-Goals:**

- Change state hydration, error recovery, persistence, tab synchronization, or readiness timing.
- Add a skeleton shell, progress percentage, loading card, logo, dependency, or remote asset.
- Change loaders used by Analytics, Import, MCP, or Editor export previews.

## Decisions

Replace the database glyph and text row with a 32 px inline SVG ring using a subdued signal-color
track and one stronger rounded leading arc. Local SVG geometry plus CSS keeps the loader
theme-aware, crisp at every device scale, and independent of a decorative icon library glyph. The
ring spins only when motion is allowed; its static asymmetry still identifies loading when reduced
motion is enabled.

The status element owns a localized `Loading` accessible name and contains only an `aria-hidden`
visual ring. No screen-reader-only text node is needed, so the visible subtree cannot accidentally
expose a label through CSS regressions.

The browser test intercepts the initial server state request, holds it long enough to inspect the
transient UI, and then releases the real request. It asserts the status role and localized name,
absence of visible text, exact viewport centering, ring geometry, and successful transition to the
application. This changes neither request content nor production timing.

## Risks / Trade-offs

- [A very fast load can make the spinner appear briefly] → Keep the indicator small, centered, and
  free of layout chrome; do not add an artificial minimum duration.
- [Animation can be uncomfortable] → Gate rotation with `motion-safe` and retain an identifiable
  static ring under reduced motion.
- [Removing visible copy can reduce technical detail] → Startup has no user decision; preserve a
  localized accessible name and keep existing explicit error UI for failures.
