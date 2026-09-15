## MODIFIED Requirements

### Requirement: Editor provides durable canvas tools
The Editor SHALL place a View-local tools surface directly below its existing upper-right actions,
including Select, Text, Arrow, Sticker, Image, and full-View Image export without a separator between
the tool buttons and export action. The Text tool SHALL use a letter `T` icon, and exactly one tool
SHALL appear active. Choosing Text, Arrow, Sticker, or Image SHALL clear the current Unit, Employee,
and canvas-element selection before activating the requested creation workflow; choosing another
tool while an element is selected SHALL immediately remove that element's selection frame and
properties. Text and Sticker SHALL support bounded text, bundled font, size, weight, foreground,
horizontal and vertical alignment, rotation, and resizing; Sticker SHALL additionally support
background color. Image SHALL support local file and clipboard PNG, JPEG, or WebP insertion,
aspect-preserving resize, and rotation. Arrow SHALL be a cubic Bezier with editable control handles,
color, width, dash style, and independent endpoint markers. The tools surface SHALL remain usable in
an otherwise empty View, and its contextual properties SHALL use compact bounded groups that wrap
without clipped or overlapping control text. Width and Height controls SHALL show and commit whole
logical pixels with a step of one while the State validator continues to accept existing finite
fractional dimensions.

#### Scenario: Add and format every durable element
- **WHEN** the user creates Text, Sticker, Image, and Arrow elements and changes their supported properties
- **THEN** the active View renders the committed values at their world coordinates and Undo/Redo treats each completed edit as one View-local command

#### Scenario: Insert a clipboard image
- **WHEN** the canvas has editing focus and the user pastes a supported local image outside an editable field
- **THEN** one selected Image element is created at the current viewport center without interpreting a remote URL or replacing native text paste

#### Scenario: Preview an interaction
- **WHEN** a move, resize, rotate, Bezier-handle, anchor, or text-edit gesture is in progress
- **THEN** its latest preview is frame-coalesced without a document write and completion creates at most one history command and automatic write

#### Scenario: Switch from a selected element to a creation tool
- **WHEN** a canvas element is selected and the user chooses Text, Arrow, Sticker, or Image
- **THEN** the prior selection and property surface clear immediately and only the chosen tool appears active

#### Scenario: Render compact tools
- **WHEN** the tools and contextual properties render at a maintained desktop or narrow viewport
- **THEN** no divider separates View Image export from the tools and every control label remains readable without colliding with another control

#### Scenario: Edit whole-pixel dimensions
- **WHEN** the user resizes a rectangular canvas element or changes its Width or Height control
- **THEN** every preview and committed width and height is a bounded integer while continuous position, rotation, and attachment geometry remain available

#### Scenario: Load legacy fractional dimensions
- **WHEN** a valid State contains a finite fractional canvas-element width or height
- **THEN** the State loads without repair, the property surface shows a rounded value, and the next explicit geometry edit normalizes the affected dimensions

#### Scenario: Finish text editing outside the draft
- **WHEN** the user clicks outside an active Text or Sticker textarea
- **THEN** the draft commits once before the empty canvas clears selection, another object replaces selection, or a property control retains the edited element selection

#### Scenario: Leave text editing with Escape
- **WHEN** the user presses Escape inside an active Text or Sticker textarea
- **THEN** the draft commits once, editing ends, and the element remains selected so a later Escape can clear the resting selection

### Requirement: Canvas entities share persistent anchors
The Editor SHALL resolve anchors through one extensible registry. Units and rectangular tools SHALL
expose four corners, four side centers, and a center; Employee occurrences SHALL expose left and
right row centers; Arrows SHALL expose start, path midpoint, and end. A rectangular attachment SHALL
store its source anchor, target reference, fallback geometry, and local offset. Arrow endpoints SHALL
use the same target-reference semantics. Attachments SHALL follow target position and geometry,
MUST NOT form a self-link or dependency cycle, and SHALL remain valid across Unit layout, Employee
reordering, Tag reflow, and element transforms. Rectangular anchor markers SHALL NOT remain visible
at rest: compact side connector handles SHALL appear only while the selected frame is hovered or
focused, and an active attachment drag SHALL reveal only its nearest valid target candidate.

#### Scenario: Follow a dynamic target
- **WHEN** an attached Unit, Employee row, or canvas element moves or changes geometry
- **THEN** every dependent element resolves from the new anchor while retaining its local offset without an unrelated persistent mutation

#### Scenario: Resolve a collapsed Employee
- **WHEN** a left or right Employee anchor belongs to a collapsed Unit
- **THEN** the anchor resolves to the matching Unit side until the row is visible again

#### Scenario: Delete or lose a target
- **WHEN** a persistent target is deleted or a Live Employee occurrence becomes unavailable
- **THEN** deletion atomically detaches dependents at their last resolved geometry while a temporarily unavailable Live occurrence uses its stored fallback and reconnects if it returns

#### Scenario: Reject a cycle
- **WHEN** an attachment would make its owner depend directly or transitively on itself
- **THEN** the Editor rejects the attachment without changing document state

#### Scenario: Reveal attachment affordances on demand
- **WHEN** a selected rectangular element is at rest, hovered or focused, and then used to begin an attachment drag
- **THEN** it shows no permanent anchor field, reveals compact side connectors only while relevant, and paints only the nearest valid target candidate during the drag

### Requirement: Canvas elements support layered group editing
Canvas elements SHALL occupy ordered `behindUnits` or `aboveUnits` planes. Arrows SHALL default
behind Units and other tools above them. The Editor SHALL support single and modifier selection,
marquee, move, copy, paste, duplicate, delete, forward/back ordering within the current plane, and a
shared resize/rotation frame for multiple canvas elements. It SHALL NOT expose a user action that
moves an existing element between planes. A plain click on a canvas element SHALL replace the
current selection with only that element, while Ctrl/Cmd SHALL toggle explicit group membership.
Pressing Escape outside an editable control, open menu, or active transform SHALL clear a resting
canvas-element selection without changing the View document or history. Right-clicking a canvas
element SHALL open an element-specific menu for the selected element set with Forward, Backward,
Front, Back, Duplicate, and Delete actions and SHALL NOT open canvas, Unit, Employee, or plane
actions. Rectangular single-element and group frames SHALL render a thin solid selection outline,
four visible corner resize markers, transparent resize targets along all four sides, and transparent
rotation targets immediately outside all four corners. Their outline and target sizes SHALL remain
constant in screen pixels across View zoom. A single rectangular element SHALL rotate around the
live world-space center derived from its current `x + width / 2` and `y + height / 2`, including
while attached; a group SHALL rotate around the exact center of the selected bounds. Side resize
SHALL alter only its corresponding dimension unless an Image aspect lock requires proportional
sizing. Resize SHALL retain the opposite edge or corner and quantize rectangle dimensions to whole
logical pixels during preview and commit. A mixed Unit/element selection SHALL support move, copy,
and delete but SHALL NOT resize or rotate Units.

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
- **THEN** the menu contains within-plane order, Duplicate, and Delete actions without plane, Unit, Employee, or empty-canvas actions

#### Scenario: Render restrained transform chrome
- **WHEN** one rectangle or an element group is selected at any supported View zoom
- **THEN** the frame shows one solid screen-pixel outline and four corner dots while side resize and outside-corner rotation retain constant-size pointer targets without persistent extra dots

#### Scenario: Resize from every edge
- **WHEN** the user drags any corner or side resize target on a rectangular element or canvas-element group
- **THEN** the preview follows that edge, retains the opposite edge or corner, produces whole-pixel rectangle dimensions, respects minimum size and Image aspect lock, and commits one history command

#### Scenario: Rotate one rectangle around its live center
- **WHEN** the user rotates one free or attached rectangular canvas element after changing its width or height
- **THEN** every preview sample and the committed element preserve the world point at `x + width / 2`, `y + height / 2` while only its angle changes

#### Scenario: Rotate a group from the perimeter
- **WHEN** the user drags an outside-corner rotation target for multiple canvas elements
- **THEN** every selected canvas element rotates around the center derived from the selected bounds' width and height and commits one history command

#### Scenario: Transform a group
- **WHEN** the user moves, resizes, or rotates multiple selected canvas elements
- **THEN** integer rectangular dimensions, Arrow endpoints and controls, and attachment offsets commit as one command while externally attached elements remain attached

#### Scenario: Render two planes
- **WHEN** the View contains elements in both planes
- **THEN** hierarchy connections render first, behind-Unit elements render next, Unit cards render next, and above-Unit elements render last using stable order within each plane
