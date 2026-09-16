## Context

The Editor currently renders View management and history at the top start, structural actions plus
the canvas tool/property stack at the top end, and viewport controls at the bottom start. Most outer
surfaces use a shared-looking 48-pixel treatment, but the canvas tool and property surfaces define
their own smaller bordered and shadowed geometry. Contextual properties also repeat the four actions
already owned by the canvas-element context menu.

Persistent Text and Sticker typography stores a string family plus weight 400, 500, or 700. Strict
State validation accepts ten historical family names. DOM, text measurement, draft editing, and PNG
consume that stored family, while Image export has a separate ten-family session-only list. The
change must preserve strict current State startup, DOM/PNG parity, local-only rendering, and both
server and Pages behavior.

## Goals / Non-Goals

**Goals:**

- Give Editor chrome one responsive, collision-free spatial model and one visual metric set.
- Keep canvas-element commands in the context menu while presenting only editable appearance and
  geometry in contextual properties.
- Offer one System/Georgia family contract and Regular/Bold editing across canvas and Image export.
- Load previous valid canvas typography without repair or a startup failure and render it
  deterministically through the new contract.

**Non-Goals:**

- Change canvas geometry, attachment, z-order, history, keyboard shortcuts, export scene contents,
  or View persistence.
- Add remote or bundled fonts, a State version, migration, compatibility schema, or new dependency.
- Remove legacy values from the validator or rewrite untouched documents in the background.

## Decisions

### One responsive overlay grid owns Editor chrome placement

Keep View management in the top-start surface. The top-end surface always exists, appends View Image
export after structural commands, and moves to a second top row below the `lg` breakpoint so it
cannot collide with View management. A bottom overlay grid places combined history/viewport controls
at logical start and a two-row contextual-properties/tools dock at the geometric center. Below `lg`,
the grid stacks those rows without overlap while keeping the tool row last and centered. Logical
start mirrors in Arabic; the geometric center and world coordinates do not.

All outer surfaces reuse one class contract: 48-pixel total height, 36-pixel controls, six-pixel
padding, four-pixel gaps, eight-pixel radius, opaque-enough background blur, and no border or shadow.
Selects and inputs inside contextual properties keep their field semantics but match the 36-pixel
control height. This extends the existing top/viewport styling rather than introducing a second
visual system.

### Contextual properties contain properties, not object commands

Remove the More popover and its callbacks from the canvas toolbar. Back, Front, Duplicate, and
Delete remain in the element-specific right-click menu and existing keyboard flows. Render the
contextual row only for one selected element with applicable appearance or geometry controls; mixed
or group selection without such controls renders no empty surface. Tool changes, selection clearing,
and command history remain unchanged.

### Current typography is derived separately from accepted legacy State

Define two current families: canonical `system-ui`, labelled by the existing localized System
message and rendered with the local system sans-serif stack; and `Georgia`, rendered with local
Times/serif fallbacks. New canvas elements and Image export settings default to `system-ui`.

Keep the ten historical family strings and weight 500 in strict validation so an existing database,
import, or live peer remains valid. A shared presentation resolver maps every historical family to
`system-ui` and maps canvas-element weight 500 to 400. DOM text, drafts, measurement, auto-fit,
font readiness, and PNG painting all consume the resolved family and element weight. Untouched raw
State remains unchanged; the first explicit typography update merges the requested patch with
resolved typography and therefore stores only `system-ui` or `Georgia` and 400 or 700 in that one
history command.

Image settings are transient, so both scoped and full-View dialogs simply use the two current
families and the new System default. Their internal semantic card weights remain unchanged.

### Icon changes use the existing dependency

Use `TbSticker` from the already imported Tabler icon set and `HiOutlineMagnifyingGlass` plus
`HiOutlineBold` from the existing Heroicons set. The percentage action keeps reset-to-100-percent
behavior and gains the existing localized Reset zoom accessible name. No asset or dependency is
added.

## Risks / Trade-offs

- [A historical custom-looking canvas changes visually on load] → Resolve all legacy families and
  medium weight consistently in DOM and PNG, retain raw State until explicit editing, and cover the
  compatibility path with strict-parser and browser tests.
- [Bottom docks collide at narrow widths] → Use explicit responsive grid rows rather than unrelated
  absolute offsets and test maintained desktop, 900-pixel, and compact widths.
- [System fonts vary between operating systems] → Use explicit local fallback stacks, require no
  network load, and compare DOM/PNG through the same resolver rather than cross-platform glyph
  hashes.
- [Moving export makes an empty View expose a blank-image workflow] → Preserve the existing always
  available action and render the top-end surface with Export even when structural actions are
  absent.
