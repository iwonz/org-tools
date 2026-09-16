## MODIFIED Requirements

### Requirement: Editor provides durable canvas tools
The Editor SHALL place a View-local tools surface at the bottom geometric center, including Select,
Text, Arrow, Sticker, and Image without full-View Image export or element command actions. Text SHALL
use a single thematic `T` glyph, Arrow SHALL use one cubic curve with one arrowhead, Sticker SHALL
use a square sticker glyph, and exactly one tool SHALL appear active. Choosing Text, Arrow, Sticker,
or Image SHALL clear the current Unit, Employee, and canvas-element selection before activating the
requested creation workflow.

Text and Sticker SHALL persist bounded plain content, base typography, and normalized
non-overlapping grapheme-safe inline format ranges. Selection formatting SHALL support family,
size, Regular/Bold weight, and foreground color. A non-empty range SHALL receive the requested
property, a caret SHALL apply it to subsequent input, and an element property change outside editing
SHALL apply to the complete element. Paste SHALL consume text/plain and MUST NOT retain external HTML
or styling. Pointer selection ending outside an editor and focus transfer into property controls
SHALL retain the latest logical range until formatting or genuine edit completion. Text SHALL expose
horizontal alignment and none/block/per-line fill. Sticker SHALL retain horizontal and vertical
alignment, background color, and its flat four-pixel-radius bordered surface.

Automatic Text SHALL use word-aware wrapping with grapheme fallback, fit tightly within a 48-by-32
minimum and a normal 480-by-320 logical-pixel cap, and derive one uniform rendered scale without
changing authored base or range font sizes. The scale SHALL NOT exceed one and SHALL NOT render any
fragment below 8 px. When content still exceeds 480 by 320 at that floor, width SHALL remain 480 and
height SHALL grow to preserve all content. The existing persisted `autoWidth` value SHALL represent
this automatic mode; a manual width or height edit SHALL set it false and retain a fixed frame.

The contextual property surface SHALL use one auto-width row directly above the tools and render
only for one selected element with applicable editable properties. Text geometry SHALL expose Width,
Height, and Rotation, and every Text side or corner resize target SHALL update the applicable fixed
dimensions, retain the opposite edge or corner, and recompute wrapping and rendered scale. A manual
frame too small at the 8 px floor SHALL clamp height upward to the minimum non-clipping height.
Increasing a frame SHALL restore rendering only up to authored sizes. An Image-only selection SHALL
render no geometry trigger or empty contextual row while retaining perimeter resize and rotation.
Other rectangle geometry and whole-pixel behavior SHALL remain unchanged.

Arrow SHALL keep cubic freeform controls, line styling, and independent `none` or `arrow` markers,
but marker choice SHALL use separate icon-only pressed toggles for start and end instead of Selects.
Moving or snapping one endpoint SHALL retain the opposite endpoint and preserve both control points'
normalized longitudinal and normal coordinates in the chord frame. Near-zero source length SHALL
fall back to controls one third along the new chord.

The current family values SHALL be `system-ui`, `Georgia`, `Bebas Neue`, `Lobster`, and `Montserrat`.
System SHALL use a localized label; the other names SHALL render literally. All families SHALL use
local stacks or bundled files without a remote request. Montserrat SHALL resolve as a current
family; other historical family strings SHALL resolve to System and weight 500 to Regular. Bold
SHALL request weight 700, including local synthesis for the regular-only Bebas Neue and Lobster.

#### Scenario: Use thematic tool icons
- **WHEN** the tools surface renders
- **THEN** Text shows a single `T`, Arrow shows one curved Arrow, and Sticker shows a square sticker without changing their accessible names

#### Scenario: Fit automatic Text
- **WHEN** the user creates Text, types, deletes content, inserts line breaks, or changes inline font sizes
- **THEN** word-aware shared layout keeps tight bounds up to 480 by 320, uniformly reduces rendered typography no lower than 8 px, and preserves a selectable 48-by-32 empty box

#### Scenario: Preserve exceptional automatic content
- **WHEN** automatic Text remains taller than 320 px after its smallest fragment reaches 8 px
- **THEN** its width remains 480 px and its height grows to show every character without clipping or changing authored typography

#### Scenario: Resize Text in two dimensions
- **WHEN** the user drags any Text side or corner or changes Width or Height
- **THEN** Text enters fixed-frame mode, retains the opposite edge or corner, reflows and fits without scaling above authored sizes, and commits whole-pixel geometry once

#### Scenario: Format a Text or Sticker selection
- **WHEN** the user selects part of existing Text or Sticker with pointer or keyboard and changes family, size, Bold, or color
- **THEN** only that grapheme-safe range changes, adjacent equivalent ranges normalize, and the selection survives the property-control focus transition

#### Scenario: Format at a caret
- **WHEN** the user changes inline typography at a collapsed Text or Sticker caret and continues typing
- **THEN** subsequent text uses the pending style while existing text remains unchanged

#### Scenario: Paste plain text
- **WHEN** formatted clipboard content is pasted into an active Text or Sticker editor
- **THEN** only its plain characters enter the draft using the caret style and no HTML is stored or rendered

#### Scenario: Complete rich editing once
- **WHEN** composition, outside pointer capture, genuine blur, Escape, or a tool change completes Text or Sticker editing
- **THEN** the latest text, runs, and geometry commit atomically at most once and one Undo restores the prior element

#### Scenario: Keep property focus inside editing
- **WHEN** a selected range ends outside the contenteditable or the user opens a Font, Size, Bold, or Color control
- **THEN** the current logical range remains active for that property action and opening the control does not prematurely commit the draft

#### Scenario: Choose a current canvas family
- **WHEN** the user opens a Text or Sticker Font control
- **THEN** System, Georgia, Bebas Neue, Lobster, and Montserrat are offered and the chosen local family drives draft, resting DOM, measurement, and PNG

#### Scenario: Load preceding canvas text state
- **WHEN** an immediately preceding exact plain Text or no-run Sticker shape is loaded from SQLite or explicit State import
- **THEN** it loads without a corruption error and normalizes to the current Text defaults or an empty Sticker run list without adding Undo history

#### Scenario: Reject invalid rich text
- **WHEN** State contains overlapping, unsorted, empty, out-of-range, non-grapheme-safe, or invalidly styled Text or Sticker format runs
- **THEN** the complete State is rejected atomically without replacing the current organization

#### Scenario: Render Text fill modes
- **WHEN** Text uses none, block, or lines fill with automatic or fixed geometry
- **THEN** live DOM and PNG omit fill, paint the complete final bounds, or paint padded final visual-line strips before identical scaled glyph fragments

#### Scenario: Preserve rich Sticker behavior
- **WHEN** Sticker is edited, partially formatted, aligned, or overflows its current authored-size content area
- **THEN** it retains all nine alignments, grows its minimum height without shrinking typography, and paints the same rich text and flat surface in DOM and PNG

#### Scenario: Toggle Arrow endpoint markers
- **WHEN** an Arrow is selected
- **THEN** separate accessible start and end icon buttons expose and toggle the existing marker values without rendering a marker Select

#### Scenario: Keep Image properties on the canvas
- **WHEN** only one Image is selected
- **THEN** no Geometry action or empty contextual surface renders and perimeter resize, rotation, Shift aspect preservation, context actions, and keyboard actions remain available

### Requirement: Canvas entities share persistent anchors
The Editor SHALL resolve anchors through one extensible registry. Units and rectangular tools SHALL
expose four corners, four side centers, and a center; Employee occurrences SHALL expose left and
right row centers; Arrows SHALL expose start, path midpoint, and end. A rectangular attachment SHALL
store its source anchor, target reference, fallback geometry, and local offset. Arrow endpoints SHALL
use the same target-reference semantics. Attachments SHALL follow target position and geometry,
MUST NOT form a self-link or dependency cycle, and SHALL remain valid across Unit layout, Employee
reordering, Tag reflow, and element transforms. When one or both Arrow endpoints resolve to moved
targets, both cubic controls SHALL project from their stored fallback chord into the resolved chord
using the same normalized shape as direct endpoint edits without creating a persistent mutation.
Anchor markers SHALL NOT remain visible for a resting selection. While the Arrow tool hovers an
eligible owner, or an active endpoint/attachment gesture targets one, the Editor SHALL outline only
that hovered owner and reveal all of its valid anchors. The nearest anchor inside the
zoom-independent snap radius SHALL be emphasized and SHALL be the attachment committed on release.

#### Scenario: Follow a dynamic target
- **WHEN** an attached Unit, Employee row, or canvas element moves or changes geometry
- **THEN** every dependent element resolves from the new anchor while retaining its local offset without an unrelated persistent mutation

#### Scenario: Preserve an attached Arrow shape
- **WHEN** an Arrow endpoint follows a moved target or is snapped to a new target
- **THEN** the opposite endpoint stays fixed and both controls preserve their normalized chord-frame coordinates in live DOM and PNG

#### Scenario: Resolve a collapsed Employee
- **WHEN** a left or right Employee anchor belongs to a collapsed Unit
- **THEN** the anchor resolves to the matching Unit side until the row is visible again

#### Scenario: Delete or lose a target
- **WHEN** a persistent target is deleted or a Live Employee occurrence becomes unavailable
- **THEN** deletion atomically detaches dependents at their last resolved geometry while a temporarily unavailable Live occurrence uses its stored fallback and reconnects if it returns

#### Scenario: Reject a cycle
- **WHEN** an attachment would make its owner depend directly or transitively on itself
- **THEN** the Editor rejects the attachment without changing document state

#### Scenario: Keep resting selections free of connector points
- **WHEN** a rectangular element is selected, hovered, or focused while no Arrow creation or attachment gesture is active
- **THEN** its selection frame shows no side, corner, or center connector markers

#### Scenario: Inspect one attachment target
- **WHEN** an Arrow endpoint or another attachment is dragged over an eligible Unit, Employee occurrence, canvas element, or Arrow
- **THEN** the hovered owner receives one transient outline, all of its valid anchors appear, and the nearest in-range anchor is emphasized for release

#### Scenario: Start an Arrow at an exact anchor
- **WHEN** the Arrow tool is active and the pointer hovers an eligible owner
- **THEN** the owner outline and all valid anchors appear, pointer-down on one anchor starts with an attached endpoint, and pointer-down on free canvas starts with a free endpoint

### Requirement: Canvas elements support layered group editing
Canvas elements SHALL retain ordered `behindUnits` and `aboveUnits` planes, global Back/Front,
selection, move, copy, paste, duplicate, delete, resize, and rotation behavior. A Text single-element
frame SHALL expose all four side and four corner resize targets. A single Text resize SHALL alter the
requested fixed width and height without mutating authored base or inline font sizes, then derive its
word wrapping and effective scale. A group resize SHALL apply horizontal scale to the Text frame,
vertical scale to its base and inline authored font sizes, and then fit the transformed frame once.
It SHALL preserve selected order, attachments, fallback geometry, Arrow geometry, and one-command
history. Other rectangles and mixed Unit/element restrictions SHALL retain their existing behavior.

#### Scenario: Resize one Text
- **WHEN** the user drags any Text side or corner resize target
- **THEN** the affected fixed dimensions change, the opposite edge or corner remains fixed, authored font values remain unchanged, attachment remains valid, and one command commits

#### Scenario: Clamp a small Text frame
- **WHEN** a manual Text resize requests a frame that cannot contain all content at the 8 px rendered floor
- **THEN** the preview and commit increase height to the minimum complete layout without clipping or moving the retained opposite edge unexpectedly

#### Scenario: Resize a group containing Text
- **WHEN** a selected element group containing Text is resized
- **THEN** Text frame dimensions and authored font sizes follow the group scales, final fitting runs once, and every selected element and attachment commits atomically

#### Scenario: Rotate fitted Text
- **WHEN** free or attached Text is rotated after content, typography, or manual dimensions change its final bounds
- **THEN** rotation uses the center of the current fitted width and height without detaching it

#### Scenario: Preserve global layers
- **WHEN** Back or Front is applied to Text or Sticker with mixed formatting or fill
- **THEN** its complete durable presentation moves below or above Unit cards without changing content, format runs, fill, or attachments

### Requirement: Editor exports one complete View image
The Editor SHALL provide the existing bounded full-View and scoped Image export workflows. Both
dialogs SHALL offer System, Georgia, Bebas Neue, Lobster, and Montserrat and SHALL use only local
font files or stacks. Before layout, preview, Copy, or Save, the renderer SHALL wait for every unique
output, Text-base, Sticker-base, Text-range, and Sticker-range font request. Text and Sticker rich
glyph fragments, automatic and manual fitting, effective scale, block/per-line fills, alignment,
rotation, layers, attachments, and normalized Arrow curves SHALL match the live canvas. All existing
preview navigation, safety limits, settings, Employee formatting, action icons, scope, and
transient-chrome exclusions SHALL remain unchanged.

#### Scenario: Select an output font
- **WHEN** the user opens Font in full-View or Unit/subtree Image settings
- **THEN** System, Georgia, Bebas Neue, Lobster, and Montserrat are offered and preview, Copy, and Save use the selected local stack

#### Scenario: Export fitted rich Text
- **WHEN** scoped or full-View PNG includes automatic or manually sized Text with mixed typography or fill
- **THEN** the image uses the same effective scale, fragments, lines, final bounds, glyph styling, and background geometry as the live canvas

#### Scenario: Export rich Sticker
- **WHEN** scoped or full-View PNG includes a Sticker with inline family, size, weight, or color ranges
- **THEN** the image uses the same fragments, wrapping, vertical alignment, minimum height, flat paper fill, and border as the live canvas

#### Scenario: Export a proportionally resolved Arrow
- **WHEN** PNG includes an Arrow whose endpoint moved directly or through an attachment
- **THEN** its cubic path and marker placement match the normalized shape visible on the canvas

#### Scenario: Keep fonts local
- **WHEN** either runtime renders canvas content or generates PNG with any current family
- **THEN** no remote font, font catalog, organization data, or image output request is made

#### Scenario: Preserve image workflows
- **WHEN** preview, zoom, pan, Fit, Copy, Save, density clamping, or Unit/subtree scope is used
- **THEN** the existing bounded local behavior remains available and transient interaction chrome stays out of the PNG
