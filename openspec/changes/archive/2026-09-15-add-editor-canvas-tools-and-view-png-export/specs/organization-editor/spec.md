## ADDED Requirements

### Requirement: Editor provides durable canvas tools
The Editor SHALL place a View-local tools surface directly below its existing upper-right actions,
including Select, Text, Arrow, Sticker, Image, and full-View Image export. Text and Sticker SHALL
support bounded text, bundled font, size, weight, foreground, horizontal and vertical alignment,
rotation, and resizing; Sticker SHALL additionally support background color. Image SHALL support
local file and clipboard PNG, JPEG, or WebP insertion, aspect-preserving resize, and rotation. Arrow
SHALL be a cubic Bezier with editable control handles, color, width, dash style, and independent
endpoint markers. The tools surface SHALL remain usable in an otherwise empty View.

#### Scenario: Add and format every durable element
- **WHEN** the user creates Text, Sticker, Image, and Arrow elements and changes their supported properties
- **THEN** the active View renders the committed values at their world coordinates and Undo/Redo treats each completed edit as one View-local command

#### Scenario: Insert a clipboard image
- **WHEN** the canvas has editing focus and the user pastes a supported local image outside an editable field
- **THEN** one selected Image element is created at the current viewport center without interpreting a remote URL or replacing native text paste

#### Scenario: Preview an interaction
- **WHEN** a move, resize, rotate, Bezier-handle, anchor, or text-edit gesture is in progress
- **THEN** its latest preview is frame-coalesced without a document write and completion creates at most one history command and automatic write

### Requirement: Canvas entities share persistent anchors
The Editor SHALL resolve anchors through one extensible registry. Units and rectangular tools SHALL
expose four corners, four side centers, and a center; Employee occurrences SHALL expose left and
right row centers; Arrows SHALL expose start, path midpoint, and end. A rectangular attachment SHALL
store its source anchor, target reference, fallback geometry, and local offset. Arrow endpoints SHALL
use the same target-reference semantics. Attachments SHALL follow target position and geometry,
MUST NOT form a self-link or dependency cycle, and SHALL remain valid across Unit layout, Employee
reordering, Tag reflow, and element transforms.

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

### Requirement: Canvas elements support layered group editing
Canvas elements SHALL occupy ordered `behindUnits` or `aboveUnits` planes. Arrows SHALL default
behind Units and other tools above them. The Editor SHALL support single and modifier selection,
marquee, move, copy, paste, duplicate, delete, layer-plane changes, forward/back ordering, and a
shared resize/rotation frame for multiple canvas elements. A mixed Unit/element selection SHALL
support move, copy, and delete but SHALL NOT resize or rotate Units.

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
display the final pixel dimensions and effective density before Copy or Save.

#### Scenario: Preview and export a complete View
- **WHEN** the user opens full-View Image export and previews, copies, or saves the PNG
- **THEN** every durable tool, card, hierarchy connection, font, color, alignment, rotation, embedded image, Arrow, and distribution tone is painted from one shared scene with the same composition

#### Scenario: Bound a requested density
- **WHEN** the selected density would exceed the preview, final-pixel, or canvas-side limit
- **THEN** the render plan clamps only the raster scale, reports the actual pixel dimensions and effective density, and preserves the complete logical scene

#### Scenario: Omit transient chrome
- **WHEN** selection, hover, focus, menus, anchors, resize or rotation handles, Bezier controls, marquee, or placement overlays are visible
- **THEN** none of those transient states appear in preview, copied PNG, or saved PNG

### Requirement: Scoped Editor PNG includes related annotations
Unit-only and subtree Image export SHALL include the selected Unit closure plus rectangular elements
attached transitively to included owners. It SHALL include an Arrow only when both endpoint targets
belong to included owners. Free-standing, externally attached, and unrelated elements SHALL remain
exclusive to full-View Image export. JSON and Template Editor export SHALL remain structural and
MUST NOT include canvas elements.

#### Scenario: Export a related annotation chain
- **WHEN** a scoped Unit export has a Sticker attached to an included Employee and Text attached to that Sticker
- **THEN** both rectangular elements appear with resolved geometry in the PNG

#### Scenario: Exclude an external Arrow
- **WHEN** one Arrow endpoint targets the scoped branch and the other targets an owner outside it
- **THEN** the Arrow and any otherwise unreachable dependent annotation are absent from that scoped PNG

