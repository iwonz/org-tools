## MODIFIED Requirements

### Requirement: Manual Units support View-local open positions

The Org Editor SHALL let a user create and edit open positions inside manual Units. Each position
MUST have a stable UUID, a non-empty title, zero or more dated or undated assignments to the global
Tag catalog, and a required nullable background color using the current Employee Tag color contract.
It SHALL render as a selectable Employee-like row with a neutral placeholder avatar, vertically
aligned title, complete Tag chips, deterministic ordering, virtualized geometry, and no global
Employee record. Live Units MUST NOT contain or create open positions.

#### Scenario: Add and edit an open position
- **WHEN** a user activates Add open position, chooses no background or a named/custom color,
  confirms the default or a custom title and Tags, and later edits that position
- **THEN** the Unit renders the updated row and one history entry is created for each confirmed
  operation

#### Scenario: Reject or cancel an invalid position
- **WHEN** the create or edit dialog contains an empty normalized title or is cancelled
- **THEN** no Unit, selection, history, or persistence state changes

#### Scenario: Keep Live membership derived
- **WHEN** a Unit is Live
- **THEN** Add open position is absent and the Unit contains no open-position rows

### Requirement: Editor PNG reproduces open positions

The Editor DOM and full-View or Unit/subtree PNG SHALL use the same open-position row composition,
ordering, measured geometry, title, optional persistent background, placeholder avatar, complete Tag
chips, collapse visibility, and anchor resolution. Scoped PNG SHALL include canvas elements
transitively attached to included open positions. Employee-format templates SHALL apply only to
Employees, and transient position selection, menus, focus, hover, or drop feedback MUST NOT appear
in PNG.

#### Scenario: Export a mixed Unit
- **WHEN** an expanded Unit containing Employees plus transparent and colored open positions is
  exported
- **THEN** DOM and PNG contain the same ordered rows, titles, backgrounds, Tags, placeholder avatars,
  and Unit bounds while the header summary counts only Employees

#### Scenario: Export attached annotations
- **WHEN** a Unit or subtree PNG includes an open position with attached canvas elements
- **THEN** the transitively attached elements are included and resolve to the same row anchors as
  the full-View renderer

### Requirement: Open-position rows have a distinct vacancy outline

Every visible open-position row SHALL have a persistent one-pixel dashed outline around its complete
Employee-row bounds with the existing row radius and placeholder avatar. The outline itself MUST NOT
add a fill, while the row MAY render its configured persistent background beneath it. Neither the
outline nor background MUST change measured height, content width, sorting, virtualization, hit
testing, selection, drop handling, or anchor geometry. Ordinary Employee rows MUST NOT receive the
vacancy outline or open-position background.

#### Scenario: Render resting vacancies
- **WHEN** an expanded manual Unit contains transparent and colored open positions
- **THEN** each complete row, including any wrapped Tag area, has the neutral dashed outline, only
  the configured rows have a tonal background, and neighboring Employee rows remain ordinary

#### Scenario: Interact with a vacancy
- **WHEN** a colored open position is hovered, focused, selected, or targeted by a single-Employee
  drop
- **THEN** the dashed outline remains visible and the existing primary or signal transient feedback
  retains semantic contrast

#### Scenario: Preserve row geometry
- **WHEN** the vacancy outline or configured background renders or its interaction state changes
- **THEN** the row bounds, text and Tag layout, pointer target, side anchors, Unit bounds, and attached
  canvas geometry remain unchanged

#### Scenario: Export a vacancy
- **WHEN** full-View or Unit/subtree Image export includes transparent and colored open positions
- **THEN** PNG paints each configured tonal background and the same unfilled one-logical-pixel dashed
  outline over complete shared row bounds while excluding transient interaction styling
