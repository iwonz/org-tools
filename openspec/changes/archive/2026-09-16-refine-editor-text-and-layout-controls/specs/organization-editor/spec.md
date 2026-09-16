## MODIFIED Requirements

### Requirement: The generic editor retains six product surfaces
The application SHALL provide localized Units, Employees, Editor, Analytics, Calendar, and Download
surfaces in that visual and keyboard order, with Editor active for a blank workspace, no visible
wordmark or brand icon, and consistent actionable top-level empty states. A populated Employees
surface SHALL show the total catalog count below search and SHALL additionally show the visible match
count only while search or filters are active. The populated Editor SHALL place Search, layout,
hierarchy, and Image export controls in one compact top logical-end toolbar surface, a View selector
and lifecycle actions at the top logical start, history plus viewport controls at the bottom logical
start, and tools at the bottom geometric center. Editor and Units SHALL operate on the same Unit
document only while the system View is active; custom Views SHALL keep independent Unit documents
over the global Employee catalog. The Editor canvas SHALL retain a distinct neutral-gray background
while the sidebar, context header, and ordinary workflows use the layered shell system. Selected
Team nodes SHALL retain the same opaque background as their resting state and communicate selection
only through the existing semantic boundary. Layout and hierarchy commands SHALL use normal text
weight and place their thematic icon before the label. Closing Editor Search SHALL clear its query,
and an empty query SHALL render no explanatory result surface.

#### Scenario: Product navigation order
- **WHEN** the product shell renders in any supported locale
- **THEN** Download is the final tab after Calendar in both DOM and keyboard navigation order

#### Scenario: Empty workspace navigation
- **WHEN** the workspace has no Units or Employees in either supported locale
- **THEN** each tab remains reachable and shows the shared localized empty layout without controls that require absent data

#### Scenario: Feature-specific empty data
- **WHEN** Download or Analytics has no Employees or Calendar has no birthdays or dated tags
- **THEN** the surface omits its data chrome and offers one relevant action through the header or shared empty layout

#### Scenario: Empty Org Editor
- **WHEN** the active View contains no Units
- **THEN** Unit-dependent layout and zoom controls are absent while View management, canvas tools, and full-View Image export remain available

#### Scenario: Sidebar application shell
- **WHEN** the product shell renders in light or dark theme
- **THEN** one dark 240 px sidebar contains the six product destinations followed by Import, Export,
  locale, and theme controls without a visible wordmark or Org Tools title
- **AND** one 64 px content header contains the active workflow icon, localized title, and at most one contextual workflow action

#### Scenario: Narrow application shell
- **WHEN** the viewport is narrower than 1024 px
- **THEN** the sidebar uses a 64 px icon rail whose controls hide visible labels while retaining localized accessible names and tooltips
- **AND** the workspace and icon-only context action remain contained without page-level overflow or changing navigation order

#### Scenario: Populated Employee catalog count
- **WHEN** the Employees surface contains Employees and no search or filter is active
- **THEN** the localized total Employee count appears below the search field without a redundant Employees heading

#### Scenario: Filtered Employee catalog count
- **WHEN** Employee search or filters are active
- **THEN** the count line keeps the localized total Employee count and adds the localized visible match count

#### Scenario: Editor control surfaces
- **WHEN** current Units exist
- **THEN** View management is top-left, Search, layout, hierarchy, and Image export are top-right, history plus viewport controls are bottom-left without an internal separator, and tools are centered at the bottom
- **AND** every toolbar surface shares the same background, blur, radius, six-pixel padding, 48-pixel height, and 36-pixel control height without a decorative border or shadow

#### Scenario: Editor search placement
- **WHEN** Search is the inner-start control in the top logical-end group and the user opens it
- **THEN** the field expands inward from its trigger while the complete group remains within the viewport
- **AND** no results surface appears until the user enters a non-empty query

#### Scenario: Selected Team node
- **WHEN** a Team node is selected or passively hovered in either theme
- **THEN** its computed background and opacity equal its resting presentation
- **AND** selection changes only the existing border color without a shadow, transform, or geometry change

#### Scenario: Close Editor search
- **WHEN** the user closes Editor Search
- **THEN** the field and results close together and the retained query becomes empty

#### Scenario: Neutral Editor canvas
- **WHEN** the Org Editor is visible in light or dark theme
- **THEN** its canvas uses a neutral-gray canvas background distinct from the root application surface
- **AND** Team nodes, selection, connectors, search, and viewport controls remain legible

### Requirement: Arrange targets an explicit Unit multi-selection
Every Vertical or Horizontal layout activation SHALL arrange using that requested direction,
including a repeated activation of the already selected direction. When at least two Units are
selected, the activation SHALL lay out only those Units as an induced forest. It SHALL preserve the
previous group center, snap affected origins to the 24-unit grid, avoid overlap with unselected
Units, preserve selection, and create one history command and organization write. Zero or one
selected Unit SHALL arrange the complete hierarchy. A separate Arrange action SHALL NOT render.

#### Scenario: Repeat the active layout direction
- **WHEN** the user activates the currently selected Vertical or Horizontal layout direction
- **THEN** the applicable Unit hierarchy is arranged again in that direction as one undoable command

#### Scenario: Arrange selected Units from a direction
- **WHEN** two or more Units are selected and either layout direction is activated
- **THEN** only their coordinates change and their internal selected parent relationships determine layout

#### Scenario: Keep unselected descendants stationary
- **WHEN** a selected Unit has an unselected descendant
- **THEN** selected-only arrangement does not move or implicitly select that descendant

#### Scenario: Undo selected arrangement
- **WHEN** selected-only arrangement completes and Undo is activated
- **THEN** one undo restores all affected coordinates without changing unselected Units

### Requirement: Layout directions are independently selectable
The Editor SHALL preserve the compact two-icon layout control with separate accessible pressed
buttons for top-down and left-to-right direction. Activating either direction SHALL invoke the
existing undoable arrangement command in that direction, including repeated activation of the
currently pressed direction. At least two selected Units SHALL use selected-only arrangement;
otherwise the complete hierarchy SHALL be arranged. A separate Arrange command SHALL NOT render.

#### Scenario: Select one direction explicitly
- **WHEN** a user clicks or keyboard-activates a direction button
- **THEN** that direction becomes active and the applicable hierarchy is arranged once

#### Scenario: Repeat one direction explicitly
- **WHEN** a user activates the already pressed direction button
- **THEN** the applicable hierarchy is arranged again in that direction as one undoable command

#### Scenario: Undo a direction arrangement
- **WHEN** the user activates a direction and then performs Undo
- **THEN** the previous direction and Unit geometry are restored together

### Requirement: Editor controls maximize and respect the canvas
Editor SHALL omit the shared content header. View management SHALL occupy the top logical-start
surface. Search, layout direction, Collapse/Expand, and full-View Image export SHALL occupy a top
logical-end surface, with Export last and available in an empty View. Undo/Redo SHALL join viewport
scale and focus controls in one bottom logical-start surface without a separator between history and
viewport actions. Select, Text, Arrow, Sticker, and Image tools SHALL occupy the bottom geometric
center, with applicable contextual properties in a separate same-width row directly above them.
Search SHALL be the inner-start control and expand away from the anchored group without shifting its
other actions. View settings SHALL group its sections through spacing and headings without a
horizontal divider.

Every Editor toolbar surface SHALL use the same non-bordered, non-shadowed background, blur, radius,
six-pixel padding, 48-pixel total height, and 36-pixel button height. At widths below the maintained
desktop layout, top and bottom groups SHALL stack into collision-free rows without clipping controls.
Arabic RTL SHALL mirror logical placement while centered tools and the world layer retain their
geometric positions and LTR coordinates.

#### Scenario: Render Editor controls in LTR
- **WHEN** Editor opens in a left-to-right locale at desktop width
- **THEN** View management is top-left, Search, layout, hierarchy, and Export are top-right, history and viewport controls are bottom-left without an internal divider, and tools are centered at the bottom

#### Scenario: Render Editor controls in RTL
- **WHEN** Editor opens in Arabic
- **THEN** logical start and end toolbar positions mirror while the tool dock stays geometrically centered and stored Unit geometry and drag results do not change

#### Scenario: Match toolbar presentation
- **WHEN** View, canvas-command, history/viewport, tool, and contextual-property surfaces render
- **THEN** their backgrounds, radius, blur, padding, lack of border and shadow, total heights, and button heights follow the shared Editor toolbar metrics

#### Scenario: Avoid compact toolbar collisions
- **WHEN** Editor renders below the maintained desktop breakpoint with or without contextual properties
- **THEN** the top-end and bottom toolbar groups use separate rows without overlap, clipping, or moving the centered tool row off screen

#### Scenario: Separate View settings semantically
- **WHEN** View settings shows Unit display and Distribution mode
- **THEN** headings and spacing distinguish the sections without a horizontal rule

#### Scenario: Export an empty View
- **WHEN** the active View has no Units or canvas elements
- **THEN** the top-end surface still exposes full-View Image export while Unit-dependent structural commands remain absent

### Requirement: Editor provides durable canvas tools
The Editor SHALL place a View-local tools surface at the bottom geometric center, including Select,
Text, Arrow, Sticker, and Image without full-View Image export or element command actions. Text SHALL
use a `Tt` glyph, Arrow SHALL use a Bezier-curve glyph, Sticker SHALL use a square sticker glyph, and
exactly one tool SHALL appear active. Choosing Text, Arrow, Sticker, or Image SHALL clear the current
Unit, Employee, and canvas-element selection before activating the requested creation workflow.

Text SHALL persist bounded plain content, base typography, normalized non-overlapping grapheme-safe
inline format ranges, automatic/fixed width, derived height, and none/block/per-line fill. Selection
formatting SHALL support family, size, Regular/Bold weight, and foreground color. A non-empty range
SHALL receive the requested property, a caret SHALL apply it to subsequent input, and an element
property change outside editing SHALL apply to the complete Text. Paste SHALL consume text/plain and
MUST NOT retain external HTML or styling. Text SHALL expose horizontal alignment only. Sticker SHALL
retain bounded plain text, horizontal and vertical alignment, background color, and its flat
four-pixel-radius bordered surface.

The contextual property surface SHALL use one auto-width row directly above the tools and render
only for one selected element with applicable editable properties. Text geometry SHALL expose Width
and Rotation without Height. Text left/right and corner resize targets SHALL modify width only;
height SHALL be derived from content, wrapping, and font sizes. New auto-width Text SHALL follow its
content until a manual width edit switches it to fixed-width. Empty Text SHALL retain at least a
48-by-32 logical-pixel selectable box. Other rectangle geometry and whole-pixel behavior SHALL
remain unchanged.

The current family values SHALL be `system-ui`, `Georgia`, `Bebas Neue`, `Lobster`, and `Montserrat`.
System SHALL use a localized label; the other names SHALL render literally. All families SHALL use
local stacks or bundled files without a remote request. Montserrat SHALL resolve as a current
family; other historical family strings SHALL resolve to System and weight 500 to Regular. Bold
SHALL request weight 700, including local synthesis for the regular-only Bebas Neue and Lobster.

#### Scenario: Use thematic tool icons
- **WHEN** the tools surface renders
- **THEN** Text shows `Tt`, Arrow shows a Bezier curve, and Sticker shows a square sticker without changing their accessible names

#### Scenario: Create automatic Text
- **WHEN** the user creates Text, types, deletes all content, or changes its inline font sizes
- **THEN** auto-width follows content, height always follows the shared layout, and empty content retains a selectable minimum box

#### Scenario: Fix Text width manually
- **WHEN** the user drags a Text width target or changes its Width field
- **THEN** width becomes fixed, text wraps within it, derived height updates, and no direct Height action is available

#### Scenario: Format a Text selection
- **WHEN** the user selects part of Text and changes family, size, Bold, or color
- **THEN** only that grapheme-safe range changes and adjacent equivalent ranges normalize without losing content or selection

#### Scenario: Format at a caret
- **WHEN** the user changes inline typography at a collapsed caret and continues typing
- **THEN** subsequent text uses the pending style while existing text remains unchanged

#### Scenario: Paste plain text
- **WHEN** formatted clipboard content is pasted into an active Text editor
- **THEN** only its plain characters enter the draft using the caret style and no HTML is stored or rendered

#### Scenario: Complete rich editing once
- **WHEN** composition, outside pointer capture, blur, Escape, or a tool change completes Text editing
- **THEN** the latest text, runs, and derived geometry commit atomically at most once and one Undo restores the prior element

#### Scenario: Choose a current canvas family
- **WHEN** the user opens a Text or Sticker Font control
- **THEN** System, Georgia, Bebas Neue, Lobster, and Montserrat are offered and the chosen local family drives draft, resting DOM, measurement, and PNG

#### Scenario: Load preceding Text state
- **WHEN** the immediately preceding exact plain Text shape is loaded from SQLite or explicit State import
- **THEN** it loads without a corruption error and normalizes once to fixed width, top alignment, no runs, no fill, and shared-layout height without adding Undo history

#### Scenario: Reject invalid rich Text
- **WHEN** State contains overlapping, unsorted, empty, out-of-range, non-grapheme-safe, or invalidly styled Text format runs
- **THEN** the complete State is rejected atomically without replacing the current organization

#### Scenario: Render Text fill modes
- **WHEN** Text uses none, block, or lines fill with a configured color
- **THEN** live DOM and PNG omit fill, paint the complete rounded bounds, or paint padded rounded visual-line strips respectively before identical glyph fragments

#### Scenario: Preserve Sticker behavior
- **WHEN** Sticker is edited or aligned
- **THEN** it retains plain-text editing, all nine alignment combinations, and the same flat live/PNG surface

### Requirement: Canvas elements support layered group editing
Canvas elements SHALL retain ordered `behindUnits` and `aboveUnits` planes, global Back/Front,
selection, move, copy, paste, duplicate, delete, resize, and rotation behavior. A Text single-element
frame SHALL omit top/bottom side resize targets, and every Text resize target SHALL alter width only
before deriving height. A group resize SHALL apply horizontal scale to Text width, vertical scale to
its base and inline font sizes, and then derive Text height once. It SHALL preserve selected order,
attachments, fallback geometry, Arrow geometry, and one-command history. Other rectangles and mixed
Unit/element restrictions SHALL retain their existing behavior.

#### Scenario: Resize one Text
- **WHEN** the user drags a Text side or corner resize target
- **THEN** only width is directly resized, the opposite horizontal edge remains fixed, height is derived, attachment remains valid, and one command commits

#### Scenario: Resize a group containing Text
- **WHEN** a selected element group containing Text is resized
- **THEN** Text width and font sizes follow the group scales, Text height is derived, and every selected element and attachment commits atomically

#### Scenario: Rotate derived Text
- **WHEN** free or attached Text is rotated after content or typography changes its derived bounds
- **THEN** rotation uses the center of the current derived width and height without detaching it

#### Scenario: Preserve global layers
- **WHEN** Back or Front is applied to Text with mixed formatting or fill
- **THEN** its complete durable presentation moves below or above Unit cards without changing content, format runs, fill, or attachments

### Requirement: Editor exports one complete View image
The Editor SHALL provide the existing bounded full-View and scoped Image export workflows. Both
dialogs SHALL offer System, Georgia, Bebas Neue, Lobster, and Montserrat and SHALL use only local
font files or stacks. Before layout, preview, Copy, or Save, the renderer SHALL wait for every unique
output, Text-base, Sticker, and Text-range font request. Rich Text glyph fragments, block/per-line
fills, automatic geometry, alignment, rotation, layers, and attachments SHALL match the live canvas.
All existing preview navigation, safety limits, settings, Employee formatting, action icons, scope,
and transient-chrome exclusions SHALL remain unchanged.

#### Scenario: Select an output font
- **WHEN** the user opens Font in full-View or Unit/subtree Image settings
- **THEN** System, Georgia, Bebas Neue, Lobster, and Montserrat are offered and preview, Copy, and Save use the selected local stack

#### Scenario: Export rich Text
- **WHEN** scoped or full-View PNG includes Text with mixed family, size, weight, color, wrapping, or fill
- **THEN** the image uses the same fragment and line geometry, derived bounds, glyph styling, and background painting as the live canvas

#### Scenario: Keep fonts local
- **WHEN** either runtime renders canvas content or generates PNG with any current family
- **THEN** no remote font, font catalog, organization data, or image output request is made

#### Scenario: Preserve image workflows
- **WHEN** preview, zoom, pan, Fit, Copy, Save, density clamping, or Unit/subtree scope is used
- **THEN** the existing bounded local behavior remains available and transient interaction chrome stays out of the PNG
