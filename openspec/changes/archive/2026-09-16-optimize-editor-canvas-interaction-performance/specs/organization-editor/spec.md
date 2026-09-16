## ADDED Requirements

### Requirement: Editor interaction work remains isolated from stable scene content
The Editor SHALL preserve complete interactive and visual behavior while keeping transient viewport,
gesture, and rich-text work proportional to the visible or directly affected scene. Pan and zoom
SHALL update the live world transform at most once per animation frame without re-rendering stable
Unit or canvas-element nodes. The mounted scene SHALL cover the complete visible viewport and MAY
reuse a bounded overscanned render window until the viewport leaves that window. Unit and
canvas-element gestures SHALL update only the selected owners, their attachment-dependent closure,
and the required interaction overlays before the single durable commit. The Editor SHALL NOT hide,
rasterize, or simplify stable content to meet this requirement.

#### Scenario: Pan inside the buffered render window
- **WHEN** repeated pointer samples pan a large annotated View without crossing its buffered render
  window
- **THEN** the world transform and grid follow the latest animation-frame sample
- **AND** stable Unit, connection, Text, Sticker, Image, and Arrow nodes do not re-render
- **AND** no rich-text layout or durable write occurs before release

#### Scenario: Pan or zoom crosses the buffered window
- **WHEN** the visible viewport would leave the current overscanned render window
- **THEN** the Editor queries a replacement window before visible content can be omitted
- **AND** the replacement is derived from spatial indexes rather than full per-frame collection
  scans

#### Scenario: Canvas gesture affects an attachment closure
- **WHEN** a Unit or canvas element moves, resizes, rotates, or changes an Arrow endpoint
- **THEN** transient rendering updates the selected objects, their dependent attachments, and the
  active overlays without invalidating unrelated scene nodes
- **AND** completion creates no more than one existing history command and persistence notification

### Requirement: Editor rich text reuses bounded local layout work
Text and Sticker rendering SHALL use one canonical rich-text layout behavior across resting DOM,
editing DOM, bounds, anchors, and Editor PNG. The interactive runtime SHALL reuse font measurements
and completed layouts until layout-affecting content, typography, geometry, or local font readiness
changes. Caches SHALL be bounded and local to the application runtime. Active editing SHALL keep its
draft and selection transient, coalesce layout work to animation frames, preserve plain-text paste,
IME, partial formatting, and Escape/blur semantics, and commit at most once.

#### Scenario: Viewport changes after editing long text
- **WHEN** a Text or Sticker containing up to 64 KiB has a current completed layout and the user pans
  or zooms the View
- **THEN** the Editor reuses that layout without re-segmenting or remeasuring the text
- **AND** DOM and PNG retain the same lines, fragments, fills, bounds, fonts, and alignment

#### Scenario: User edits one rich-text range
- **WHEN** input, paste, composition, deletion, or toolbar formatting changes one range
- **THEN** only the active draft and its affected layout work update during editing
- **AND** unrelated Units and canvas elements retain their render and layout revisions
- **AND** finishing the edit creates one history command and one synchronization

#### Scenario: A bundled font becomes ready
- **WHEN** a local font request used by Text or Sticker finishes loading
- **THEN** only elements that use that request invalidate their measured layout
- **AND** no remote font request, telemetry, or organization-data persistence occurs

### Requirement: Large annotated Editor Views have a measurable performance contract
The maintained large Editor scenario SHALL cover 20,000 Employees, 4,000 expanded Units, at least
1,200 Text, Sticker, and Arrow elements, attachments, and maximum-size rich text in both server and
Pages runtimes. Local test diagnostics SHALL expose numeric render, layout, measurement, and
invalidation counts without organization content, persistence, or network transmission. After
warm-up, the scenario SHALL target 60 frames per second, gate the 95th-percentile animation-frame
interval at 33 milliseconds, reject an interaction pause above 100 milliseconds, and gate the
95th-percentile long-text input-to-next-paint delay at 50 milliseconds.

#### Scenario: Large View interaction regression test
- **WHEN** automated browser coverage pans, zooms, edits long rich text, and transforms canvas
  elements in the maintained large annotated View
- **THEN** deterministic counters prove that unrelated scene and layout work did not run
- **AND** measured frame and input delays remain within the maintained coarse budgets
- **AND** preview writes remain absent and each completed operation retains its existing single-write
  contract
