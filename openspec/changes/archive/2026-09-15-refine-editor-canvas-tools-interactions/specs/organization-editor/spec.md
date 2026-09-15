## MODIFIED Requirements

### Requirement: Editor provides durable canvas tools
The Editor SHALL place a View-local tools surface directly below its existing upper-right actions,
including Select, Text, Arrow, Sticker, Image, and full-View Image export without a separator between
the tool buttons and export action. Exactly one tool SHALL appear active. Choosing Text, Arrow,
Sticker, or Image SHALL clear the current Unit, Employee, and canvas-element selection before
activating the requested creation workflow; choosing another tool while an element is selected SHALL
immediately remove that element's selection frame and properties. Text and Sticker SHALL support
bounded text, bundled font, size, weight, foreground, horizontal and vertical alignment, rotation,
and resizing; Sticker SHALL additionally support background color. Image SHALL support local file
and clipboard PNG, JPEG, or WebP insertion, aspect-preserving resize, and rotation. Arrow SHALL be a
cubic Bezier with editable control handles, color, width, dash style, and independent endpoint
markers. The tools surface SHALL remain usable in an otherwise empty View, and its contextual
properties SHALL use compact bounded groups that wrap without clipped or overlapping control text.

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

### Requirement: Canvas elements support layered group editing
Canvas elements SHALL occupy ordered `behindUnits` or `aboveUnits` planes. Arrows SHALL default
behind Units and other tools above them. The Editor SHALL support single and modifier selection,
marquee, move, copy, paste, duplicate, delete, layer-plane changes, forward/back ordering, and a
shared resize/rotation frame for multiple canvas elements. A plain click on a canvas element SHALL
replace the current selection with only that element, while Ctrl/Cmd SHALL toggle explicit group
membership. Right-clicking a canvas element SHALL open an element-specific menu for the selected
element set with plane, Forward, Backward, Front, Back, Duplicate, and Delete actions and SHALL NOT
open canvas, Unit, or Employee actions. Rectangular single-element and group frames SHALL expose
resize targets at all four corners and all four side centers, plus rotation targets at all four
corners instead of one detached rotation point. Rotation SHALL use the exact center of the selected
bounds, and side resize SHALL alter only its corresponding dimension unless an Image aspect lock
requires proportional sizing. A mixed Unit/element selection SHALL support move, copy, and delete
but SHALL NOT resize or rotate Units.

#### Scenario: Select one element plainly
- **WHEN** multiple canvas elements or mixed canvas items are selected and the user clicks one canvas element without Ctrl/Cmd
- **THEN** only the clicked element remains selected and only its contextual properties render

#### Scenario: Open element actions
- **WHEN** the user right-clicks a selected canvas element
- **THEN** the menu contains element layer/order, Duplicate, and Delete actions without Unit, Employee, or empty-canvas actions

#### Scenario: Resize from every edge
- **WHEN** the user drags any corner or side resize target on a rectangular element or canvas-element group
- **THEN** the preview follows that edge, retains the opposite edge or corner, respects minimum size and Image aspect lock, and commits one history command

#### Scenario: Rotate from the perimeter
- **WHEN** the user drags a rotation target at any selected-frame corner
- **THEN** every selected canvas element rotates around the center derived from the selected bounds' width and height and commits one history command

#### Scenario: Transform a group
- **WHEN** the user moves, resizes, or rotates multiple selected canvas elements
- **THEN** rectangular geometry, Arrow endpoints and controls, and attachment offsets commit as one command while externally attached elements remain attached

#### Scenario: Render two planes
- **WHEN** the View contains elements in both planes
- **THEN** hierarchy connections render first, behind-Unit elements render next, Unit cards render next, and above-Unit elements render last using stable order within each plane

### Requirement: Editor exports one complete View image
The Editor SHALL provide an image-only full-View export dialog whose scene contains every Unit,
hierarchy connection, and durable canvas element regardless of viewport. Collapsed cards SHALL keep
their collapsed roster/footer presentation while descendant Units remain part of the structural
scene. The dialog SHALL retain background, padding, title, title font/size/alignment, Unit radius,
Employee format, and boss-label controls; it SHALL add 1x, 2x, and 3x density with 2x default and
display the final pixel dimensions and effective density before Copy or Save. Its Employee format
SHALL use the shared token-aware Format input with `@` suggestions and documented `?` conditional
expressions. Its footer Copy and Save actions SHALL use the same clipboard and download icons as the
scoped Editor export dialog.

#### Scenario: Preview and export a complete View
- **WHEN** the user opens full-View Image export and previews, copies, or saves the PNG
- **THEN** every durable tool, card, hierarchy connection, font, color, alignment, rotation, embedded image, Arrow, and distribution tone is painted from one shared scene with the same composition

#### Scenario: Configure the Employee format
- **WHEN** the user focuses the full-View Employee Format help or types `@` in its input
- **THEN** localized help explains token suggestions and `?` conditionals, matching Employee tokens can be inserted, and existing conditional expressions continue to render in preview, Copy, and Save

#### Scenario: Use consistent export actions
- **WHEN** the full-View Image dialog footer renders
- **THEN** Copy has the clipboard icon and Save has the download icon used by scoped Editor Image export

#### Scenario: Bound a requested density
- **WHEN** the selected density would exceed the preview, final-pixel, or canvas-side limit
- **THEN** the render plan clamps only the raster scale, reports the actual pixel dimensions and effective density, and preserves the complete logical scene

#### Scenario: Omit transient chrome
- **WHEN** selection, hover, focus, menus, anchors, resize or rotation handles, Bezier controls, marquee, or placement overlays are visible
- **THEN** none of those transient states appear in preview, copied PNG, or saved PNG
