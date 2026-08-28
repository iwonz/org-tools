## ADDED Requirements

### Requirement: Editor coordinates follow an adaptive snap grid
The Org Editor SHALL use one 24-unit document-space base grid for visible grid lines and every
coordinate produced by an explicit Unit movement or arrangement. The visible grid SHALL use
power-of-two multiples of that base step as needed to keep line density legible while zooming, and
its origin SHALL follow the transformed document origin. Drag, add, import, paste, overlap
avoidance, hierarchy relayout, and full arrangement SHALL finish with every affected Unit origin on
the base step. Opening an existing workspace SHALL NOT mutate legacy coordinates until an explicit
editor operation affects them. Grid rendering SHALL remain a constant-cost background operation and
SHALL NOT change PNG dimensions, connection behavior, selection behavior, or organization data.

#### Scenario: Adaptive zoom density
- **WHEN** the user zooms the Editor from its minimum to maximum supported scale
- **THEN** the visible line spacing adapts in power-of-two document increments instead of becoming
  illegibly dense or sparse
- **AND** every visible line continues to represent a valid 24-unit snap coordinate

#### Scenario: Drag snaps to the visible coordinate system
- **WHEN** the user finishes dragging one or more Units
- **THEN** every moved Unit origin is an exact multiple of 24 document units on both axes

#### Scenario: Created and arranged geometry snaps
- **WHEN** the user adds, imports, pastes, reconnects, expands, collapses, or arranges Units
- **THEN** every Unit whose coordinates are produced or changed by that operation finishes on the
  shared 24-unit base grid without overlapping a stationary Unit

#### Scenario: Existing document opens losslessly
- **WHEN** a valid workspace contains a Unit whose stored coordinate is not on the base grid
- **THEN** opening and viewing that workspace preserves the coordinate until an explicit editor
  operation affects that Unit
