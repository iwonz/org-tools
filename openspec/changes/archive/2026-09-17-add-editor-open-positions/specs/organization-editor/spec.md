## ADDED Requirements

### Requirement: Manual Units support View-local open positions

The Org Editor SHALL let a user create and edit open positions inside manual Units. Each position
MUST have a stable UUID, a non-empty title, and zero or more dated or undated assignments to the
global Tag catalog. It SHALL render as a selectable Employee-like row with a neutral placeholder
avatar, vertically aligned title, complete Tag chips, deterministic ordering, virtualized geometry,
and no global Employee record. Live Units MUST NOT contain or create open positions.

#### Scenario: Add and edit an open position
- **WHEN** a user activates Add open position on a manual Unit, confirms the default or a custom
  title and Tags, and later edits that position
- **THEN** the Unit renders the updated placeholder row and one history entry is created for each
  confirmed operation

#### Scenario: Reject an invalid position
- **WHEN** the create or edit dialog contains an empty normalized title or is cancelled
- **THEN** no Unit, selection, history, or persistence state changes

#### Scenario: Keep Live membership derived
- **WHEN** a Unit is Live
- **THEN** Add open position is absent and the Unit contains no open-position rows

### Requirement: Open positions participate in Editor row geometry and Tags

Employee and open-position rows SHALL use one discriminated ordered layout with measured Tag-chip
heights and prefix offsets for DOM rendering, virtualization, bounds, hit testing, Unit layout, and
canvas anchors. Boss Employees SHALL remain first; other rows SHALL follow active Tag grouping,
display name or title, and stable ID. Open-position Tags SHALL affect row ordering and display but
MUST NOT affect Employee counts, distribution state, or Unit Tag-cloud summaries. Collapse SHALL
hide positions and retain a deterministic Unit-edge fallback for their anchors.

#### Scenario: Group a tagged position
- **WHEN** Group by tag is enabled for a manual Unit containing Employees and tagged open positions
- **THEN** all rows follow the shared deterministic order while Employee counts and Tag-cloud counts
  remain based only on distinct Employees

#### Scenario: Virtualize a large mixed roster
- **WHEN** a Unit contains enough Employee and open-position rows to cross the virtualization limit
- **THEN** only the visible row window mounts while bounds, pointer hit testing, and anchors use the
  complete cached prefix-offset layout

#### Scenario: Collapse an attached position
- **WHEN** a canvas element targets an open-position side anchor and the Unit collapses
- **THEN** the target resolves to the corresponding Unit edge without losing its persistent link

### Requirement: Open positions support replacement and deletion

An open-position context menu SHALL expose Edit, Replace with Employee, and Delete. Replacement
SHALL use a single-select Employee picker. Picker replacement SHALL add the chosen Employee to the
target Unit without removing other occurrences; dropping exactly one Employee occurrence from
another manual Unit SHALL use existing move semantics. Both paths MUST atomically remove the
position, select the resulting Employee occurrence, and rekey all position attachments without
changing their world geometry. Position Tags MUST NOT modify the Employee. Multi-Employee drops
MUST use the ordinary Unit drop without consuming a position.

#### Scenario: Replace from the picker
- **WHEN** a user chooses one Employee in Replace with Employee
- **THEN** the Employee occurs in the target Unit, remains in every other Unit, the position is
  removed, its attachments target the Employee occurrence, and Undo restores the complete prior state

#### Scenario: Replace by dragging one Employee
- **WHEN** one Employee occurrence from another manual Unit is dropped on an open position
- **THEN** the occurrence moves using the existing boss and position rules, consumes the open
  position, and preserves attached canvas geometry as one command

#### Scenario: Replace with an existing target Employee
- **WHEN** the chosen Employee already occurs in the target Unit
- **THEN** only the position is removed and its attachments are rekeyed to the existing occurrence

#### Scenario: Delete an attached position
- **WHEN** a selected open position is deleted from its context menu or the keyboard
- **THEN** it is removed and incoming canvas attachments detach at their last resolved world
  coordinates in the same undoable command

### Requirement: Editor PNG reproduces open positions

The Editor DOM and full-View or Unit/subtree PNG SHALL use the same open-position row composition,
ordering, measured geometry, title, placeholder avatar, complete Tag chips, collapse visibility, and
anchor resolution. Scoped PNG SHALL include canvas elements transitively attached to included open
positions. Employee-format templates SHALL apply only to Employees, and transient position
selection, menus, or drop feedback MUST NOT appear in PNG.

#### Scenario: Export a mixed Unit
- **WHEN** an expanded Unit containing Employees and open positions is exported
- **THEN** DOM and PNG contain the same ordered rows, titles, Tags, placeholder avatars, and Unit
  bounds while the header summary counts only Employees

#### Scenario: Export attached annotations
- **WHEN** a Unit or subtree PNG includes an open position with attached canvas elements
- **THEN** the transitively attached elements are included and resolve to the same row anchors as
  the full-View renderer
