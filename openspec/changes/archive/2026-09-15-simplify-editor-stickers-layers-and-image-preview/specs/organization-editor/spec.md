## MODIFIED Requirements

### Requirement: Editor provides durable canvas tools
The Editor SHALL place a View-local tools surface directly below its existing upper-right actions,
including Select, Text, Arrow, Sticker, Image, and full-View Image export without a separator between
the tool buttons and export action. The Text tool SHALL use a letter `T` icon, the full-View Image
export label SHALL use normal font weight, and exactly one tool SHALL appear active. Choosing Text,
Arrow, Sticker, or Image SHALL clear the current Unit, Employee, and canvas-element selection before
activating the requested creation workflow; choosing another tool while an element is selected SHALL
immediately remove that element's selection frame and properties. Text and Sticker SHALL support
bounded text, bundled font, size, weight, foreground, horizontal and vertical alignment, rotation,
and resizing. Sticker SHALL additionally support background color and a flat four-pixel-radius
surface with one tonal border and no fold, sheen, or shadow, mirrored in Editor PNG. Image SHALL
support local file and clipboard PNG, JPEG, or WebP insertion, independent-axis resize,
Shift-modified aspect-preserving resize, and rotation without a persistent aspect-lock control.
Arrow SHALL be a cubic Bezier with editable control handles, color, width, dash style, and independent
endpoint markers. The tools surface SHALL remain usable in an otherwise empty View.

The contextual property surface SHALL use one auto-width row without empty reserved groups. It SHALL
keep applicable appearance controls inline, expose horizontal and vertical text alignment through
one icon-only 3-by-3 popover, expose Width, Height, and Rotation through one geometry popover, and
expose Back, Front, Duplicate, and Delete through one More menu. Long localized control names SHALL
remain available through accessible names and tooltips without appearing as clipped trigger text.
Width and Height controls SHALL show and commit whole logical pixels with a step of one while the
State validator continues to accept existing finite fractional dimensions.

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
- **WHEN** one element or an applicable group is selected at a maintained desktop or narrow viewport
- **THEN** one contextual row shows only applicable controls, uses popovers for alignment, geometry, and common actions, and contains no clipped label or empty full-width property group

#### Scenario: Choose two-dimensional text alignment
- **WHEN** the user opens alignment for Text or Sticker and chooses one of the nine horizontal and vertical combinations
- **THEN** the trigger reflects that combination and draft, resting DOM, and PNG use the same saved alignment

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

### Requirement: Canvas elements support layered group editing
Canvas elements SHALL occupy ordered `behindUnits` or `aboveUnits` planes. Arrows SHALL default
behind Units and other tools above them. The Editor SHALL support single and modifier selection,
marquee, move, copy, paste, duplicate, delete, global Back and Front ordering, and a shared
resize/rotation frame for multiple canvas elements. Back SHALL move only the selected elements to
the beginning of `behindUnits`; Front SHALL move only the selected elements to the end of
`aboveUnits`. Both commands SHALL preserve the selected block's relative order, every attachment and
offset, and unselected targets and dependents as one undoable command. Unit cards and their Employee
rows SHALL remain one indivisible plane, with hierarchy connections retaining their fixed base
layer. Forward, Backward, and explicit plane actions SHALL NOT be exposed.

A plain click on a canvas element SHALL replace the current selection with only that element, while
Ctrl/Cmd SHALL toggle explicit group membership. Pressing Escape outside an editable control, open
menu, or active transform SHALL clear a resting canvas-element selection without changing the View
document or history. Right-clicking a canvas element SHALL open an element-specific menu for the
selected element set with Back, Front, Duplicate, and Delete actions and SHALL NOT open canvas, Unit,
Employee, intermediate-order, or plane actions. Rectangular single-element and group frames SHALL
render a thin solid selection outline, four visible corner resize markers, transparent resize
targets along all four sides, and transparent rotation targets immediately outside all four corners.
Their outline and target sizes SHALL remain constant in screen pixels across View zoom. A single
rectangular element SHALL rotate around the live world-space center derived from its current
`x + width / 2` and `y + height / 2`, including while attached; a group SHALL rotate around the exact
center of the selected bounds. Side resize SHALL alter only its corresponding dimension. Holding
Shift while resizing one Image SHALL preserve that Image's aspect ratio for the current pointer
sample; no stored aspect-lock value SHALL affect the gesture. Resize SHALL retain the opposite edge
or corner and quantize rectangle dimensions to whole logical pixels during preview and commit. A
mixed Unit/element selection SHALL support move, copy, and delete but SHALL NOT resize or rotate
Units.

#### Scenario: Select one element plainly
- **WHEN** multiple canvas elements or mixed canvas items are selected and the user clicks one canvas element without Ctrl/Cmd
- **THEN** only the clicked element remains selected and only its contextual properties render

#### Scenario: Clear an element selection with Escape
- **WHEN** one or more canvas elements are selected at rest and focus is outside an editable control or open menu
- **THEN** pressing Escape clears the selection frame and contextual properties without changing canvas elements or adding history

#### Scenario: Preserve Escape priority
- **WHEN** a canvas menu, editable control, or transform gesture is active
- **THEN** Escape is handled by or reserved for that active interaction before any resting canvas-element selection is cleared

#### Scenario: Open concise element actions
- **WHEN** the user opens More or right-clicks a selected canvas element
- **THEN** the menu contains Back, Front, Duplicate, and Delete without Forward, Backward, plane, Unit, Employee, or empty-canvas actions

#### Scenario: Send every element kind behind Units
- **WHEN** Text, Sticker, Image, Arrow, or a selected group activates Back while above or below a Unit Employee row
- **THEN** only the selected block moves to the back extreme below the complete Unit card while its internal order and attachment graph remain unchanged

#### Scenario: Bring every element kind in front of Units
- **WHEN** Text, Sticker, Image, Arrow, or a selected group activates Front while above or below a Unit Employee row
- **THEN** only the selected block moves to the front extreme above the complete Unit card while its internal order and attachment graph remain unchanged

#### Scenario: Render restrained transform chrome
- **WHEN** one rectangle or an element group is selected at any supported View zoom
- **THEN** the frame shows one solid screen-pixel outline and four corner dots while side resize and outside-corner rotation retain constant-size pointer targets without persistent extra dots or connector markers

#### Scenario: Resize from every edge
- **WHEN** the user drags any corner or side resize target on a rectangular element or canvas-element group
- **THEN** the preview follows that edge, retains the opposite edge or corner, produces whole-pixel rectangle dimensions, respects minimum size and the current Shift modifier for one Image, and commits one history command

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

### Requirement: Editor exports one complete View image
The Editor SHALL provide an image-only full-View export dialog whose scene contains every Unit,
hierarchy connection, and durable canvas element regardless of viewport. Collapsed cards SHALL keep
their collapsed roster/footer presentation while descendant Units remain part of the structural
scene. The dialog SHALL retain background, padding, title, title font/size/alignment, Unit radius,
Employee format, and boss-label controls and SHALL offer 1x, 2x, and 3x density with 2x default. It
SHALL NOT display final pixel dimensions, effective density, or density-clamping copy. Preview and
final rendering SHALL still enforce the existing raster pixel and canvas-side limits. Its Employee
format SHALL use the shared token-aware Format input with `@` suggestions and documented `?`
conditional expressions. Its footer Copy and Save actions SHALL use the same clipboard and download
icons as the scoped Editor Image export dialog. Text and Sticker SHALL load and paint their selected
locally bundled family and weight, and Sticker SHALL retain its live flat fill and border.

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

#### Scenario: Preserve canvas typography and flat Sticker treatment
- **WHEN** Text and Sticker elements use different supported font families, weights, colors, alignments, and rotations
- **THEN** the live canvas and PNG load and apply those exact bundled fonts and paint the same flat Sticker fill and border inside unchanged element bounds

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
