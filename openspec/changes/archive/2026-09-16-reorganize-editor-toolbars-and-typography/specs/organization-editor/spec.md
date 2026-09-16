## MODIFIED Requirements

### Requirement: Editor controls maximize and respect the canvas
Editor SHALL omit the shared content header. View management SHALL occupy the top logical-start
surface. Search, layout direction, Arrange, Collapse/Expand, and full-View Image export SHALL occupy
a top logical-end surface, with Export last and available in an empty View. Undo/Redo SHALL join
viewport scale and focus controls in one bottom logical-start surface. Select, Text, Arrow, Sticker,
and Image tools SHALL occupy the bottom geometric center, with applicable contextual properties in a
separate same-width row directly above them. Search SHALL be the inner-start control and expand away
from the anchored group without shifting its other actions.

Every Editor toolbar surface SHALL use the same non-bordered, non-shadowed background, blur, radius,
six-pixel padding, 48-pixel total height, and 36-pixel button height. At widths below the maintained
desktop layout, top and bottom groups SHALL stack into collision-free rows without clipping controls.
Arabic RTL SHALL mirror logical placement while centered tools and the world layer retain their
geometric positions and LTR coordinates.

#### Scenario: Render Editor controls in LTR
- **WHEN** Editor opens in a left-to-right locale at desktop width
- **THEN** View management is top-left, canvas commands and Export are top-right, history and viewport controls are bottom-left, and tools are centered at the bottom

#### Scenario: Render Editor controls in RTL
- **WHEN** Editor opens in Arabic
- **THEN** logical start and end toolbar positions mirror while the tool dock stays geometrically centered and stored Unit geometry and drag results do not change

#### Scenario: Match toolbar presentation
- **WHEN** View, canvas-command, history/viewport, tool, and contextual-property surfaces render
- **THEN** their backgrounds, radius, blur, padding, lack of border and shadow, total heights, and button heights follow the shared Editor toolbar metrics

#### Scenario: Avoid compact toolbar collisions
- **WHEN** Editor renders below the maintained desktop breakpoint with or without contextual properties
- **THEN** the top-end and bottom toolbar groups use separate rows without overlap, clipping, or moving the centered tool row off screen

#### Scenario: Export an empty View
- **WHEN** the active View has no Units or canvas elements
- **THEN** the top-end surface still exposes full-View Image export while Unit-dependent structural commands remain absent

### Requirement: The Editor exposes accessible View management
The Editor SHALL show a styled View Select and Create action in every canvas state. Custom Views
SHALL also expose Rename and Delete actions. View management SHALL remain one standalone top
logical-start surface while Undo/Redo occupy the combined history/viewport surface at the bottom
logical start. Create SHALL accept a name and either Blank or Copy with any current View as source.

#### Scenario: Manage an empty custom View
- **WHEN** an active custom View contains no Units
- **THEN** its Select, Create, Rename, and Delete controls remain available at the top logical start

#### Scenario: Cancel View deletion
- **WHEN** the user closes or cancels the confirmation
- **THEN** the View, active selection, Download source, and documents remain unchanged

### Requirement: Editor provides durable canvas tools
The Editor SHALL place a View-local tools surface at the bottom geometric center, including Select,
Text, Arrow, Sticker, and Image without full-View Image export or element command actions. The Text
tool SHALL use a letter `T` icon, Sticker SHALL use a sticker-shaped icon, and exactly one tool SHALL
appear active. Choosing Text, Arrow, Sticker, or Image SHALL clear the current Unit, Employee, and
canvas-element selection before activating the requested creation workflow; choosing another tool
while an element is selected SHALL immediately remove that element's selection frame and properties.
Text and Sticker SHALL support bounded text, System or Georgia family, size, Regular or Bold weight,
foreground, horizontal and vertical alignment, rotation, and resizing. Bold SHALL be one pressed
toggle that stores 700 when active and 400 when inactive; current UI operations SHALL NOT create
weight 500. Sticker SHALL additionally support background color and a flat four-pixel-radius surface
with one tonal border and no fold, sheen, or shadow, mirrored in Editor PNG. Image SHALL support
local file and clipboard PNG, JPEG, or WebP insertion, independent-axis resize, Shift-modified
aspect-preserving resize, and rotation without a persistent aspect-lock control. Arrow SHALL be a
cubic Bezier with editable control handles, color, width, dash style, and independent endpoint
markers. The tools surface SHALL remain usable in an otherwise empty View.

The contextual property surface SHALL use one auto-width row directly above the tools and SHALL
render only for one selected element with applicable editable properties. It SHALL keep applicable
appearance controls inline, expose horizontal and vertical text alignment through one icon-only
3-by-3 popover, and expose Width, Height, and Rotation through one geometry popover. Back, Front,
Duplicate, Delete, and a More trigger SHALL NOT appear in contextual properties; those commands
remain in the canvas-element context menu and existing keyboard flows. Long localized control names
SHALL remain available through accessible names and tooltips without appearing as clipped trigger
text. Width and Height controls SHALL show and commit whole logical pixels with a step of one while
the State validator continues to accept existing finite fractional dimensions.

The current family values SHALL be canonical `system-ui`, presented as localized System with a
local sans-serif stack, and `Georgia`, presented with local Times/serif fallbacks. The State validator
SHALL continue to accept the previous ten canvas family strings and weight 500. Resting DOM, drafts,
measurement, auto-fit, and PNG SHALL resolve a legacy family to System and legacy weight 500 to
Regular without changing untouched State. The first explicit typography edit SHALL store the
resolved current family and weight together with the requested change as one history command.

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

#### Scenario: Render compact properties without commands
- **WHEN** one element, a group, or a mixed canvas selection is active at a maintained desktop or narrow viewport
- **THEN** one selected element shows only applicable appearance and geometry controls while a selection without shared editable properties shows no empty row or duplicate context-menu actions

#### Scenario: Choose two-dimensional text alignment
- **WHEN** the user opens alignment for Text or Sticker and chooses one of the nine horizontal and vertical combinations
- **THEN** the trigger reflects that combination and draft, resting DOM, and PNG use the same saved alignment

#### Scenario: Toggle Bold
- **WHEN** the user activates or deactivates the Bold button for Text or Sticker
- **THEN** its pressed state and text use weight 700 or 400 respectively and the completed toggle creates one history command

#### Scenario: Choose a current canvas family
- **WHEN** the user opens the Text or Sticker Font control
- **THEN** only localized System and Georgia are offered and the selected family is used by resting DOM, editing draft, measurement, and PNG

#### Scenario: Load legacy typography
- **WHEN** a valid State contains one of the previous canvas font families or weight 500
- **THEN** the State loads without repair or a corruption error, renders as System and Regular in DOM and PNG, and the first explicit typography edit stores current resolved values

#### Scenario: Edit whole-pixel dimensions
- **WHEN** the user resizes a rectangular canvas element or changes its Width or Height control
- **THEN** every preview and committed width and height is a bounded integer while continuous position, rotation, and attachment geometry remain available

#### Scenario: Resize an Image with a gesture modifier
- **WHEN** the user resizes an Image without Shift and then holds or releases Shift during the gesture
- **THEN** ordinary resize follows the dragged axes, Shift preserves the Image aspect ratio immediately, and no persistent aspect-lock control is present

#### Scenario: Load legacy fractional dimensions
- **WHEN** a valid State contains a finite fractional canvas-element width or height
- **THEN** the State loads without repair, the geometry surface shows a rounded value, and the next explicit geometry edit normalizes the affected dimensions

#### Scenario: Render a flat Sticker
- **WHEN** a Sticker renders on the live canvas or in Editor PNG
- **THEN** its configured fill, tonal border, text, typography, alignment, bounds, and rotation match without a fold, sheen, or shadow

#### Scenario: Keep a draft at its final alignment
- **WHEN** the user creates or reopens Text or Sticker editing, changes its draft, and finishes editing
- **THEN** wrapping and horizontal and vertical placement remain stable across focus and blur, overflow grows transiently, and text plus final height commit once

#### Scenario: Finish text editing outside the draft
- **WHEN** the user clicks outside an active Text or Sticker textarea
- **THEN** the draft commits once before the empty canvas clears selection, another object replaces selection, or a property control retains the edited element selection

#### Scenario: Leave text editing with Escape
- **WHEN** the user presses Escape inside an active Text or Sticker textarea
- **THEN** the draft commits once, editing ends, and the element remains selected so a later Escape can clear the resting selection

### Requirement: Editor exports one complete View image
The Editor SHALL provide an image-only full-View export dialog whose scene contains every Unit,
hierarchy connection, and durable canvas element regardless of viewport. Collapsed cards SHALL keep
their collapsed roster/footer presentation while descendant Units remain part of the structural
scene. The dialog SHALL retain background, padding, title, title font/size/alignment, Unit radius,
Employee format, and boss-label controls and SHALL offer 1x, 2x, and 3x density with 2x default. Both
full-View and Unit/subtree Image dialogs SHALL offer exactly localized System and Georgia for their
output font, default to System, and resolve those values through the same local stacks used by canvas
Text and Sticker. They SHALL NOT request a remote font.

The dialogs SHALL NOT display final pixel dimensions, effective density, or density-clamping copy.
Preview and final rendering SHALL still enforce the existing raster pixel and canvas-side limits.
The full-View Employee format SHALL use the shared token-aware Format input with `@` suggestions and
documented `?` conditional expressions. Its footer Copy and Save actions SHALL use the same clipboard
and download icons as the scoped Editor Image export dialog. Text and Sticker SHALL load and paint
their resolved current local family and element weight, and Sticker SHALL retain its live flat fill
and border.

Both full-View and Unit/subtree Image dialogs SHALL render their local object-URL preview through one
transient viewport. It SHALL begin fitted, support pointer-centered wheel zoom, centered Zoom In and
Zoom Out, 100-percent reset, Fit, constrained primary-pointer pan, and keyboard pan. Scale SHALL be
bounded from the smaller of Fit and 10 percent through 400 percent, with 100 percent representing one
preview pixel per CSS pixel. Regeneration SHALL retain Fit when untouched and otherwise preserve the
manual scale and normalized focal point. Preview viewport state SHALL NOT enter View state, history,
storage, synchronization, final PNG composition, or network traffic.

#### Scenario: Preview and export a complete View
- **WHEN** the user opens full-View Image export and previews, copies, or saves the PNG
- **THEN** every durable tool, card, hierarchy connection, font, color, alignment, rotation, embedded image, Arrow, and distribution tone is painted from one shared scene with the same composition

#### Scenario: Select an output font
- **WHEN** the user opens Font in full-View or Unit/subtree Image settings
- **THEN** only localized System and Georgia are offered and preview, Copy, and Save use the selected local fallback stack

#### Scenario: Preserve resolved canvas typography and flat Sticker treatment
- **WHEN** Text and Sticker elements use System, Georgia, or accepted legacy typography with different colors, alignments, and rotations
- **THEN** the live canvas and PNG use the same resolved family and Regular/Bold element weight and paint the same flat Sticker fill and border inside unchanged element bounds

#### Scenario: Navigate either PNG preview
- **WHEN** the user wheels at a point, uses Zoom In, Zoom Out, 100 percent, or Fit, drags the preview, or presses a pan key in either Image dialog
- **THEN** only the local preview viewport changes around the requested focal point within its scale and translation bounds

#### Scenario: Preserve manual inspection during regeneration
- **WHEN** Image settings regenerate a preview after the user has manually zoomed or panned
- **THEN** the new preview preserves the manual scale and normalized focal point, while an untouched fitted preview remains fitted

#### Scenario: Hide render-plan copy while retaining safety
- **WHEN** either Image export dialog renders or a requested density exceeds a raster safety limit
- **THEN** no final-dimension, effective-density, or clamping label appears and preview, Copy, and Save still use the safely clamped complete scene

#### Scenario: Configure the Employee format
- **WHEN** the user focuses the full-View Employee Format help or types `@` in its input
- **THEN** localized help explains token suggestions and `?` conditionals, matching Employee tokens can be inserted, and existing conditional expressions continue to render in preview, Copy, and Save

#### Scenario: Use consistent export actions
- **WHEN** the full-View Image dialog footer renders
- **THEN** Copy has the clipboard icon and Save has the download icon used by scoped Editor Image export

#### Scenario: Bound a requested density
- **WHEN** the selected density would exceed the preview, final-pixel, or canvas-side limit
- **THEN** the render plan silently clamps only the raster scale and preserves the complete logical scene

#### Scenario: Omit transient chrome
- **WHEN** selection, hover, focus, menus, anchors, target outlines, preview controls, resize or rotation handles, Bezier controls, marquee, or placement overlays are visible
- **THEN** none of those transient states appear in preview, copied PNG, or saved PNG
