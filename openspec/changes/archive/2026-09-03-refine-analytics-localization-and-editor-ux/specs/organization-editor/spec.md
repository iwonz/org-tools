## ADDED Requirements

### Requirement: Unit group drag preserves intentional selection
Pointer-down on an already selected Unit SHALL retain an all-Unit multi-selection while movement is
pending. Crossing the drag threshold SHALL move and keep that group selected; releasing without
movement SHALL preserve ordinary single-click replacement behavior.

#### Scenario: Drag a selected group
- **WHEN** multiple Units are selected and the user drags one selected Unit beyond the threshold
- **THEN** all selected Units move together and the same selected IDs remain after release

#### Scenario: Click inside a selected group
- **WHEN** multiple Units are selected and the user clicks one without dragging
- **THEN** ordinary selection reduces to that Unit without creating a move command

### Requirement: Arrange targets an explicit Unit multi-selection
When at least two Units are selected, Arrange SHALL label itself `Arrange selected` and lay out only
those Units as an induced forest. It SHALL preserve the previous group center, snap affected origins
to the 24-unit grid, avoid overlap with unselected Units, preserve selection, and create one history
command and organization write. Zero or one selected Unit SHALL retain full-hierarchy Arrange.

#### Scenario: Arrange selected Units
- **WHEN** two or more Units are selected and Arrange is activated
- **THEN** only their coordinates change and their internal selected parent relationships determine layout

#### Scenario: Keep unselected descendants stationary
- **WHEN** a selected Unit has an unselected descendant
- **THEN** selected-only Arrange does not move or implicitly select that descendant

#### Scenario: Undo selected arrangement
- **WHEN** selected-only Arrange completes and Undo is activated
- **THEN** one undo restores all affected coordinates without changing unselected Units

### Requirement: Editor controls maximize and respect the canvas
Editor SHALL omit the shared content header. Undo/Redo SHALL occupy a dedicated top logical-start
surface. Search, layout direction, Arrange, and Collapse/Expand SHALL occupy a same-height top
logical-end surface. Search SHALL be the inner-start control and expand away from the anchored group
without shifting its other actions. Arabic RTL SHALL mirror logical placement while the world layer
retains LTR coordinates.

#### Scenario: Render Editor controls in LTR
- **WHEN** Editor opens in a left-to-right locale
- **THEN** history is top-left, canvas commands are top-right, and Search expands left

#### Scenario: Render Editor controls in RTL
- **WHEN** Editor opens in Arabic
- **THEN** logical toolbar positions mirror while stored Unit geometry and drag results do not

#### Scenario: Match toolbar heights
- **WHEN** top and bottom Editor surfaces render
- **THEN** history, canvas command, and viewport controls use the same total height

## MODIFIED Requirements

### Requirement: Calendar dates use consistent interaction geometry
The Calendar SHALL format its month heading through the active locale with a bare numeric year,
render every in-month date as an actionable button with a fixed date-number row, and distinguish
weekends and the current date through stable tonal treatment. A day-dialog title SHALL preserve
locale order while omitting the abbreviated Russian year suffix. Previous and Next navigation SHALL
use the reviewed labels from the active catalog.

#### Scenario: Empty and populated dates
- **WHEN** one empty and one event date render in the same month
- **THEN** both are buttons with aligned numbers and stable hover feedback

#### Scenario: Open localized date details
- **WHEN** a user opens a day in any supported locale
- **THEN** the title follows that locale and contains no obsolete Russian year suffix

#### Scenario: Navigate in Russian
- **WHEN** Russian Calendar navigation is exposed
- **THEN** its backward and forward controls use the reviewed Russian catalog labels
