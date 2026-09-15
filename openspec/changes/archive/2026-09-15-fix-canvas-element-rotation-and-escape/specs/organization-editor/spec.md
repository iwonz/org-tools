## MODIFIED Requirements

### Requirement: Canvas elements support layered group editing
Canvas elements SHALL occupy ordered `behindUnits` or `aboveUnits` planes. Arrows SHALL default
behind Units and other tools above them. The Editor SHALL support single and modifier selection,
marquee, move, copy, paste, duplicate, delete, layer-plane changes, forward/back ordering, and a
shared resize/rotation frame for multiple canvas elements. A plain click on a canvas element SHALL
replace the current selection with only that element, while Ctrl/Cmd SHALL toggle explicit group
membership. Pressing Escape outside an editable control, open menu, or active transform SHALL clear
a resting canvas-element selection without changing the View document or history. Right-clicking a
canvas element SHALL open an element-specific menu for the selected element set with plane, Forward,
Backward, Front, Back, Duplicate, and Delete actions and SHALL NOT open canvas, Unit, or Employee
actions. Rectangular single-element and group frames SHALL expose resize targets at all four corners
and all four side centers, plus rotation targets at all four corners instead of one detached
rotation point. A single rectangular element SHALL rotate around the live world-space center derived
from its current `x + width / 2` and `y + height / 2`, including while attached; a group SHALL rotate
around the exact center of the selected bounds. Side resize SHALL alter only its corresponding
dimension unless an Image aspect lock requires proportional sizing. A mixed Unit/element selection
SHALL support move, copy, and delete but SHALL NOT resize or rotate Units.

#### Scenario: Select one element plainly
- **WHEN** multiple canvas elements or mixed canvas items are selected and the user clicks one canvas element without Ctrl/Cmd
- **THEN** only the clicked element remains selected and only its contextual properties render

#### Scenario: Clear an element selection with Escape
- **WHEN** one or more canvas elements are selected at rest and focus is outside an editable control or open menu
- **THEN** pressing Escape clears the selection frame and contextual properties without changing canvas elements or adding history

#### Scenario: Preserve Escape priority
- **WHEN** a canvas menu, editable control, or transform gesture is active
- **THEN** Escape is handled by or reserved for that active interaction before any resting canvas-element selection is cleared

#### Scenario: Open element actions
- **WHEN** the user right-clicks a selected canvas element
- **THEN** the menu contains element layer/order, Duplicate, and Delete actions without Unit, Employee, or empty-canvas actions

#### Scenario: Resize from every edge
- **WHEN** the user drags any corner or side resize target on a rectangular element or canvas-element group
- **THEN** the preview follows that edge, retains the opposite edge or corner, respects minimum size and Image aspect lock, and commits one history command

#### Scenario: Rotate one rectangle around its live center
- **WHEN** the user rotates one free or attached rectangular canvas element after changing its width or height
- **THEN** every preview sample and the committed element preserve the world point at `x + width / 2`, `y + height / 2` while only its angle changes

#### Scenario: Rotate a group from the perimeter
- **WHEN** the user drags a rotation target at any selected-frame corner for multiple canvas elements
- **THEN** every selected canvas element rotates around the center derived from the selected bounds' width and height and commits one history command

#### Scenario: Transform a group
- **WHEN** the user moves, resizes, or rotates multiple selected canvas elements
- **THEN** rectangular geometry, Arrow endpoints and controls, and attachment offsets commit as one command while externally attached elements remain attached

#### Scenario: Render two planes
- **WHEN** the View contains elements in both planes
- **THEN** hierarchy connections render first, behind-Unit elements render next, Unit cards render next, and above-Unit elements render last using stable order within each plane
