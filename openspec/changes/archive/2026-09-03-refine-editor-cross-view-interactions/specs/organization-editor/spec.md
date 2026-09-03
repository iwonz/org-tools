## MODIFIED Requirements

### Requirement: Editor coordinates follow an adaptive snap grid
The Org Editor SHALL use one 24-unit document-space base grid for visible grid lines and every
coordinate produced by an explicit Unit movement or arrangement. The visible grid SHALL use
power-of-two multiples of that base step as needed to keep line density legible while zooming, and
its origin SHALL follow the transformed document origin. Drag, add, import, paste, overlap
avoidance, hierarchy relayout, and full arrangement SHALL finish with every affected Unit origin on
the base step. Opening an existing workspace SHALL NOT mutate legacy coordinates until an explicit
editor operation affects them. Grid rendering SHALL remain a constant-cost background operation and
SHALL NOT change PNG dimensions, connection behavior, selection behavior, or organization data.
Pointer and wheel input SHALL replace the pending transient sample and render at most once per
animation frame. Pan, zoom, Unit drag, Employee drag, connection drag, and marquee selection SHALL
preview without mutating the durable viewport or document on every pointer event. A drag that enters
the final 64 screen pixels of a canvas edge after the 4 px drag threshold SHALL pan quadratically
from zero to at most 6 screen pixels per frame toward that edge; a diagonal SHALL retain the same
maximum vector magnitude. The final gesture SHALL commit at most one viewport update and at most one
organization command. Cancellation SHALL restore its starting viewport and discard every transient
preview. Viewport visibility SHALL use a geometry index built only when Unit bounds change rather
than scanning every Unit on each interaction frame.

#### Scenario: Adaptive zoom density
- **WHEN** the user zooms the Editor from its minimum to maximum supported scale
- **THEN** the visible line spacing adapts in power-of-two document increments instead of becoming illegibly dense or sparse
- **AND** every visible line continues to represent a valid 24-unit snap coordinate

#### Scenario: Drag snaps to the visible coordinate system
- **WHEN** the user finishes dragging one or more Units
- **THEN** every moved Unit origin is an exact multiple of 24 document units on both axes

#### Scenario: Created and arranged geometry snaps
- **WHEN** the user adds, imports, pastes, reconnects, expands, collapses, or arranges Units
- **THEN** every Unit whose coordinates are produced or changed by that operation finishes on the shared 24-unit base grid without overlapping a stationary Unit

#### Scenario: Existing document opens losslessly
- **WHEN** a valid workspace contains a Unit whose stored coordinate is not on the base grid
- **THEN** opening and viewing that workspace preserves the coordinate until an explicit editor operation affects that Unit

#### Scenario: Frame-coalesced viewport gesture
- **WHEN** multiple pan or wheel events arrive before the next animation frame
- **THEN** only their latest viewport preview renders in that frame
- **AND** durable UI persistence receives one final viewport after pointer release or wheel idle

#### Scenario: Transient Unit drag
- **WHEN** one or more Units move across multiple pointer events
- **THEN** preview positions and affected connections update without replacing the document Unit collection or running overlap avoidance per event
- **AND** release performs one snapped overlap-resolved command and one organization write

#### Scenario: Edge-pan every drag mode
- **WHEN** a Unit, Employee, connection, or selection-box drag crosses the threshold and remains inside a canvas edge zone
- **THEN** one animation-frame loop advances the transient viewport and keeps the dragged document target attached to the pointer
- **AND** no durable organization or viewport write occurs before release

#### Scenario: Cancel edge-pan
- **WHEN** an edge-panning gesture is cancelled
- **THEN** the gesture-start viewport and document are restored without a persistence notification

#### Scenario: Indexed large canvas
- **WHEN** the current structure contains 4,000 Units and the viewport changes
- **THEN** visible Unit and connection candidates come from the intersecting spatial buckets without a full-collection scan per frame

### Requirement: Expanded Unit cards summarize direct Tags
An expanded Unit with tagged direct Employees SHALL render a compact borderless tonal footer after
its Employee list. The footer SHALL show every catalog-ordered Tag as a filled wrapping chip with its
complete label and unique direct-Employee count. Short chips SHALL be content-sized with equal
compact insets. A long chip SHALL use no more than the footer width, wrap by words and then grapheme
clusters, and keep the `middle dot + count` suffix unbroken on the last fitting line or its own line.
Ellipsis MUST NOT be used. One deterministic shared layout SHALL drive DOM rendering, PNG rendering,
Unit height, bounds, connections, spatial indexing, snapping, and collision geometry. Descendants
SHALL NOT contribute. Live Units SHALL use their resolved direct membership. Dates SHALL NOT split a
Tag count. Collapsed and tagless Units SHALL have no footer.

#### Scenario: Count manual Unit Tags
- **WHEN** direct Employees in a manual Unit share one or more Tags
- **THEN** each Tag footer chip shows the number of distinct direct Employees with that Tag

#### Scenario: Exclude descendants
- **WHEN** only Employees in descendant Units carry a Tag
- **THEN** the parent Unit footer does not show or count that Tag

#### Scenario: Size chips by content
- **WHEN** footer Tags have labels and counts of different lengths
- **THEN** every short chip uses the same compact insets and only the width required by its own content

#### Scenario: Wrap a long multilingual Tag
- **WHEN** a Latin, Cyrillic, Arabic, CJK, or emoji Tag is wider than the footer
- **THEN** its complete label wraps without an ellipsis and its count suffix remains indivisible

#### Scenario: Wrap many Tags
- **WHEN** measured Tag chips exceed the Unit width
- **THEN** all chips wrap to additional rows and the Unit height, bounds, connections, and collision geometry expand by the shared measured footer height

#### Scenario: Export the footer
- **WHEN** Editor PNG is rendered for a Unit with a Tag footer
- **THEN** the same complete Tag labels, counts, colors, compact widths, line wrapping, and geometry appear in the image

## ADDED Requirements

### Requirement: Unit deletion produces one valid final state
Every keyboard, context-menu, Editor, and Units-surface deletion SHALL use one coordinator. The
coordinator SHALL delete a deduplicated descendant closure, materialize remaining Live Units that
reference deleted Units with their pre-delete visible direct membership, and remove all deleted IDs
from Editor selection, system Unit selection and expansion, Unit filters, and active Download
selection, filters, and exclusions before persistence can observe the result. System selection SHALL
fall back to its closest surviving ancestor, then the first surviving root, then `null`.

#### Scenario: Delete an ancestor and selected descendants
- **WHEN** the selected deletion set contains a parent, one of its descendants, and Units from another branch
- **THEN** every affected Unit is deleted exactly once and the resulting strict state contains no stale Unit reference

#### Scenario: Materialize a dependent Live Unit
- **WHEN** a surviving Live Unit references a Unit in the deletion closure
- **THEN** it becomes static with its visible direct membership from immediately before deletion

#### Scenario: Persist only a valid deletion
- **WHEN** deletion completes
- **THEN** change notification and automatic persistence run only after organization and bounded UI projections validate together
