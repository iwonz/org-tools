# organization-editor Specification

## Purpose
Define the current organization Editor, its retained interactions, and birthday-driven product behavior.
## Requirements
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

### Requirement: Editor coordinates follow an adaptive snap grid
The Org Editor SHALL use one 24-unit document-space base grid for visible grid lines and every
coordinate produced by an explicit Unit movement or arrangement. The visible grid SHALL use
power-of-two multiples of that base step as needed to keep line density legible while zooming, and
its origin SHALL follow the transformed document origin. Drag, add, import, paste, overlap
avoidance, hierarchy relayout, and full arrangement SHALL finish with every affected Unit origin on
the base step. Opening an existing workspace SHALL NOT mutate legacy coordinates until an explicit
editor operation affects them. Grid rendering SHALL remain a constant-cost background operation and
SHALL NOT change PNG dimensions, connection behavior, selection behavior, or organization data.
Pointer and wheel input SHALL replace the pending transient sample and render at most once per
animation frame. Pan, zoom, Unit drag, Employee drag, connection drag, and marquee selection SHALL
preview without mutating the durable viewport or document on every pointer event. A drag that enters
the final 64 screen pixels of a canvas edge after the 4 px drag threshold SHALL pan quadratically
from zero to at most 6 screen pixels per frame toward that edge; a diagonal SHALL retain the same
maximum vector magnitude. The final gesture SHALL commit at most one viewport update and at most one
organization command. Cancellation SHALL restore its starting viewport and discard every transient
preview. Viewport visibility SHALL use a geometry index built only when Unit bounds change rather
than scanning every Unit on each interaction frame.

#### Scenario: Adaptive zoom density
- **WHEN** the user zooms the Editor from its minimum to maximum supported scale
- **THEN** the visible line spacing adapts in power-of-two document increments instead of becoming
  illegibly dense or sparse
- **AND** every visible line continues to represent a valid 24-unit snap coordinate

#### Scenario: Drag snaps to the visible coordinate system
- **WHEN** the user finishes dragging one or more Units
- **THEN** every moved Unit origin is an exact multiple of 24 document units on both axes

#### Scenario: Created and arranged geometry snaps
- **WHEN** the user adds, imports, pastes, reconnects, expands, collapses, or arranges Units
- **THEN** every Unit whose coordinates are produced or changed by that operation finishes on the
  shared 24-unit base grid without overlapping a stationary Unit

#### Scenario: Existing document opens losslessly
- **WHEN** a valid workspace contains a Unit whose stored coordinate is not on the base grid
- **THEN** opening and viewing that workspace preserves the coordinate until an explicit editor
  operation affects that Unit

#### Scenario: Frame-coalesced viewport gesture
- **WHEN** multiple pan or wheel events arrive before the next animation frame
- **THEN** only their latest viewport preview renders in that frame
- **AND** durable UI persistence receives one final viewport after pointer release or wheel idle

#### Scenario: Transient Unit drag
- **WHEN** one or more Units move across multiple pointer events
- **THEN** preview positions and affected connections update without replacing the document Unit collection or running overlap avoidance per event
- **AND** release performs one snapped overlap-resolved command and one organization write

#### Scenario: Edge-pan every drag mode
- **WHEN** a Unit, Employee, connection, or selection-box drag crosses the threshold and remains inside a canvas edge zone
- **THEN** one animation-frame loop advances the transient viewport and keeps the dragged document target attached to the pointer
- **AND** no durable organization or viewport write occurs before release

#### Scenario: Cancel edge-pan
- **WHEN** an edge-panning gesture is cancelled
- **THEN** the gesture-start viewport and document are restored without a persistence notification

#### Scenario: Indexed large canvas
- **WHEN** the current structure contains 4,000 Units and the viewport changes
- **THEN** visible Unit and connection candidates come from the intersecting spatial buckets without a full-collection scan per frame

### Requirement: Calendar and analytics use normalized birthdays
The application SHALL use nullable complete `DD.MM.YYYY` birthdays for Employee forms and exports,
SHALL derive recurring day-and-month indexes for Calendar and birthday analytics, and SHALL treat
year `1900` as unknown. Employee create and edit SHALL provide coordinated styled Day, Month, and
Year selectors, including an explicit unknown-year choice, and SHALL reject incomplete or impossible
selections. Calendar SHALL navigate a selected month and year across year boundaries, SHALL project
February 29 birthdays to February 28 in non-leap years independent of whether their birth year is
known, SHALL include exact-date Tags, SHALL align dates under locale-ordered weekdays, and SHALL style
actual Saturday and Sunday headings and cells with one restrained rose weekend tone. Russian weeks SHALL
begin Monday and English weeks SHALL begin Sunday. Calendar SHALL fit its week-aligned grid and
bounded Tag rail without page scroll at the maintained 1280 by 720 desktop viewport. Analytics SHALL
render six content-sized groups in one full-bleed workflow with compact gaps and one uniform soft
tonal surface per group. Groups SHALL add no outer border, shadow, nested header fill, or repeated
row rule. Each Analytics group SHALL show at most eight estimated 42 px rows before using its
existing virtualized internal scroll container.

#### Scenario: Birthday selection
- **WHEN** a user creates or edits an Employee birthday
- **THEN** styled Day, Month, and Year selectors produce one valid canonical complete date or null
- **AND** selecting Unknown year persists the chosen day and month with year `1900`

#### Scenario: Birthday display
- **WHEN** an Employee has a valid birthday and the calendar displays the corresponding year and month
- **THEN** the Employee appears on the matching recurring day, using February 28 for a February 29 birthday in a non-leap display year, and in birthday aggregates

#### Scenario: Calendar week alignment
- **WHEN** a month begins after the locale's first weekday
- **THEN** leading placeholders align every date below its localized weekday heading

#### Scenario: Weekend styling
- **WHEN** Saturday or Sunday renders in the active locale order
- **THEN** its heading and current-month date cell use the same dedicated tonal surface

#### Scenario: Calendar navigation layout
- **WHEN** Calendar has birthday or dated-tag data on a maintained desktop viewport
- **THEN** its header keeps the Tag rail, month, year, Previous, and Next visible while the week-aligned grid fits without horizontal or vertical page overflow

#### Scenario: Tonal Analytics surface
- **WHEN** Analytics is ready
- **THEN** all six sortable virtualized groups and drill-down actions remain available in a
  full-bleed workflow with two desktop columns and one narrow-screen column
- **AND** each group uses one uniform borderless tone from heading through rows, while compact gaps,
  typography, scrolling, and hover or focus feedback preserve hierarchy

#### Scenario: Short Analytics group
- **WHEN** an Analytics group contains fewer than eight entries
- **THEN** the group height follows its title, table header, and rendered rows without reserving a fixed 384 px block

#### Scenario: Long Analytics group
- **WHEN** an Analytics group contains more than eight entries
- **THEN** eight rows remain visible and additional virtualized rows are reachable through internal scrolling

### Requirement: Calendar exposes dated tag events and details
Calendar day cells SHALL retain birthday avatars but SHALL represent all dated Tag assignments with
one Tag icon and localized assignment count, without inline Tag labels or a duplicate total-event
count. The day dialog SHALL retain one vertical virtualized stream with Birthdays first and each Tag
heading followed by complete shared Employee cards. Dated groups SHALL follow catalog order,
Employees SHALL use stable name order, and the same Employee SHALL appear in each applicable group.
Cards MUST NOT contain a special event-label subtitle.

#### Scenario: Render a populated day
- **WHEN** a date contains multiple dated Tag assignments
- **THEN** its cell shows one Tag icon and total assignment count without any Tag label

#### Scenario: Open a populated day
- **WHEN** a user activates a day containing birthdays and dated tags
- **THEN** one dialog scroll renders Birthdays first and each populated tag heading followed by complete Employee cards
- **AND** no empty group, second column, Dated tags heading, or event subtitle is rendered

#### Scenario: Open tag history from a day
- **WHEN** a user activates a dated-event group heading
- **THEN** the Calendar opens that label's current, future, and conditional past event history

### Requirement: Calendar provides a bounded dated-Tag rail
Calendar SHALL place dated Tag controls in a single-line horizontally scrollable rail on the left of
the same desktop header row as fixed month navigation. The Employee Calendar title and aggregate
event count SHALL NOT render. On narrow screens the rail SHALL stack above navigation.

#### Scenario: Scroll many dated Tags
- **WHEN** Tag controls exceed the available desktop width
- **THEN** only the left rail scrolls horizontally while month navigation remains visible

#### Scenario: Open a Tag from the rail
- **WHEN** a user activates a dated-Tag rail control
- **THEN** current and future events appear in ascending date order and past events appear separately in descending date order with localized dates and Employees

#### Scenario: Calendar empty state
- **WHEN** no current Employee has either a birthday or a dated tag
- **THEN** the shared Calendar empty state is shown instead of the rail and grid

### Requirement: Calendar dated-tag counts use uniform separators
The Calendar Tag rail SHALL render each dated-Tag label, one shared middle-dot separator, and its
localized count as distinct aligned elements with the same horizontal separator spacing for every
tag length and count.

#### Scenario: Dated-Tag rail spacing
- **WHEN** the Calendar renders multiple dated-tag groups with different label lengths and counts
- **THEN** every middle dot has the same computed left and right spacing and the label and count remain vertically aligned

### Requirement: Calendar returns to the current month
Month navigation SHALL show a localized Today action only when the displayed local month or year is
not current. Activating it SHALL restore the current local month and year.

#### Scenario: Return to today
- **WHEN** a user navigates away from the current month and activates Today
- **THEN** Calendar displays the current month and the Today action disappears

### Requirement: Org Editor Employee geometry follows wrapped tags
The Org Editor SHALL compute Employee row heights from all rendered localized tag chips and SHALL
use shared prefix offsets for virtualization, hitboxes, selection, connectors, layout, and bounds.
The PNG renderer SHALL draw every localized tag as a compact catalog-colored chip matching the on-screen
Employee-card treatment, including rounded geometry, typography, wrapping, and `label · date`
content. It SHALL preserve every tag character without ellipsis by wrapping oversized content inside
its chip, and SHALL derive drawing plus row-height growth from the same measured tag layout without
hidden tags, text overflow, or unused tag-row space.

#### Scenario: Tag rows change
- **WHEN** Employee tags or the active locale changes the packed chip rows
- **THEN** measurements are invalidated and every downstream canvas geometry consumer uses the updated offsets without overlap

#### Scenario: Large structure virtualization
- **WHEN** a large current structure contains variable-height Employee rows
- **THEN** only visible rows render while hit testing and connector anchors remain aligned with their Employees

#### Scenario: Export Employee tags to PNG
- **WHEN** an Employee with dated, undated, or wider-than-column tags is included in an Org Editor PNG export
- **THEN** every complete tag appears as one wrapped catalog-colored chip with card-consistent text, padding, radius, and compact row gaps
- **AND** dated tags use a localized date after a middle dot without bright blue styling, ellipsis, clipping, or reserved empty rows

### Requirement: Editor commands retain readable interaction feedback
Editor toolbar controls and command actions SHALL use an opaque tonal hover surface with readable
foreground contrast and SHALL NOT fade into the canvas. An unselected Unit card SHALL preserve its
exact resting background color and opacity during passive pointer hover.

#### Scenario: Hover an Editor command
- **WHEN** a pointer hovers an available Editor toolbar or command action in either theme
- **THEN** its label and icon remain fully legible on an opaque accent surface without changing
  control geometry

#### Scenario: Hover an Editor Unit
- **WHEN** a pointer hovers an unselected Unit card in either theme
- **THEN** the complete card keeps its exact resting background color and opacity without changing
  its dimensions, position, or selection

### Requirement: Editor PNG cards follow the live canvas geometry
The Org Editor PNG renderer SHALL derive Unit width, header height, vertical padding, Employee row
height, avatar placement, text-column origin, compact tag packing, and hierarchy connection anchors
from maintained Editor geometry and its measured export-tag layout. The default exported card SHALL
preserve the live canvas's stable visual hierarchy for Unit identity, Employee-count summary,
Employee names and complete tags, and boss indication without including Unit membership type or
transient editing controls. Image-specific title, background, font, scope, radius, Employee format,
and boss-label controls SHALL remain available, and rendering MUST remain local and bounded.

The Image Employee-format token picker MUST NOT offer `avatarBase64Url`; embedded avatars SHALL
remain a visual card concern rather than template text. The default boss value SHALL be the active
locale's equivalent of `Manager`. The inline preview SHALL have no redundant Preview heading or
expanded Open action/dialog. Title alignment SHALL use three accessible icon-only controls placed
after Title and Size in their shared row.

#### Scenario: Export one Unit with a roster
- **WHEN** a static or dynamic Unit with ordinary and boss Employees is exported with default image settings
- **THEN** the Unit header, icon, summary, avatar centers, name column, compact tags, and localized boss indicator align with the corresponding live Editor card geometry
- **AND** every Employee row begins from the same horizontal and vertical layout rhythm
- **AND** no Static, Dynamic, or Live membership-type label appears in the image

#### Scenario: Export wrapped Employee tags
- **WHEN** Employee tags wrap across or within one or more chip rows in the exported Editor geometry
- **THEN** the PNG uses one measured layout for chip positions, complete text lines, compact dimensions, and row-height growth
- **AND** no avatar, name, tag, following Employee, or Unit boundary overlaps or shifts independently

#### Scenario: Export a Unit hierarchy
- **WHEN** a subtree containing Units with different roster heights is exported
- **THEN** every connection terminates at the actual exported card boundary derived from its
  rendered rows
- **AND** Unit coordinates and relative hierarchy placement remain unchanged

#### Scenario: Preserve image customization
- **WHEN** the user changes title, background, font, scope, radius, Employee format, boss label, or icon-only title alignment
- **THEN** the renderer applies those settings without changing shared structural alignment or adding transient Editor chrome

#### Scenario: Keep image generation local and bounded
- **WHEN** a PNG inline preview, copy, or download is generated
- **THEN** embedded avatars and local vector primitives are painted without an external request
- **AND** existing avatar-count and canvas-pixel limits remain enforced

#### Scenario: Keep avatar data out of image text templates
- **WHEN** the Image Employee-format token list is rendered
- **THEN** it excludes `avatarBase64Url` while Employee avatars can still appear in exported cards

#### Scenario: Use the compact inline preview
- **WHEN** Image export is open
- **THEN** the bounded image remains visible without a Preview label, Open action, or secondary image dialog

### Requirement: Editor PNG follows persistent View presentation
The Editor PNG renderer SHALL reflect persistent active-View presentation settings and stable Unit
and Employee card semantics by default. A change that adds or modifies persistent View presentation
or stable Unit/Employee card content, styling, visibility, ordering, or status SHALL define and test
the corresponding PNG behavior in the same change. Shared semantic status, geometry, and tonal
primitives SHALL be used where the DOM and canvas renderers require different drawing mechanisms.
The PNG SHALL retain its light export palette and explicit image-only title, background, font,
scope, radius, Employee-format, and boss-label settings. Selection, hover, focus, menus, handles,
placement overlays, and other transient Editor chrome MUST NOT be mirrored.

#### Scenario: Change persistent View presentation
- **WHEN** a persistent View setting changes stable Unit or Employee card presentation
- **THEN** the live Editor and the next PNG preview, copy, or save render the same applicable content, ordering, visibility, status, and card styling

#### Scenario: Change stable card presentation
- **WHEN** stable Unit or Employee card content, geometry, or styling is changed
- **THEN** the same change specifies, implements, and tests its applicable PNG representation through shared semantics

#### Scenario: Apply image-only customization
- **WHEN** the user customizes an explicit Image export setting
- **THEN** that output setting overrides its corresponding PNG attribute without mutating or weakening persistent View presentation parity

#### Scenario: Ignore transient interaction
- **WHEN** hover, focus, selection, menus, handles, or placement overlays are visible on the Editor canvas
- **THEN** PNG output omits those transient states while preserving stable card presentation

### Requirement: Employee and Unit forms avoid redundant chrome
Employee create and edit forms SHALL expose Gender as a three-option segmented native-radio control,
Birthday as adjacent Day, Month, and Year Selects in one compound control, Tags as one wrapping
draft picker, and Unit membership with generic Unit terminology. They SHALL omit visible
storage-scope and avatar-format helper paragraphs, a separate selected-Tag list, and Add more copy.
The Unit form SHALL omit a visible Membership mode label while retaining an accessible name on the
mode switch.

#### Scenario: Create or edit Employee
- **WHEN** the Employee form opens
- **THEN** it offers segmented Male, Female, and Not specified, one compound birthday control, all draft Tag chips inside one picker trigger, and generic Unit copy
- **AND** it omits the storage, avatar-format, Add more, and separate Tag-list copy

#### Scenario: Choose Unit membership mode
- **WHEN** the Unit form renders Static and Live tabs
- **THEN** no redundant Membership mode heading is visible and assistive technology still receives
  the localized mode-switch name

### Requirement: Unit hierarchy search is always available
The Units hierarchy SHALL render its localized name search for every nonempty Unit structure,
independent of Unit count. Filtering SHALL retain the current hierarchy behavior and bounded derived
indexes without adding a threshold-specific layout.

#### Scenario: Search a small Unit structure
- **WHEN** the current structure contains fewer than twenty Units
- **THEN** the same Unit-name search shown for a large structure remains visible and functional

### Requirement: Employee filters include gender
The Employee filter popover SHALL provide exact-value gender filtering, include selected genders in
its active count and reset key, and compose the selection with query, birthday, position, tag, and
Unit filters.

#### Scenario: Filter by gender
- **WHEN** a user selects one or more gender values
- **THEN** the Employee list contains Employees matching any selected gender and all other active
  filter sections

#### Scenario: Clear gender filter
- **WHEN** the user clears the Gender section or all filters
- **THEN** no gender constraint remains and the virtualized list resets to the current result start

### Requirement: Calendar dates use consistent interaction geometry
The Calendar SHALL format its month heading through the active locale with a bare numeric year,
render every in-month date with a fixed date-number row, and expose a day as an actionable button
only when it contains at least one current birthday or dated Tag assignment. Empty dates SHALL not
open a dialog or present pointer/hover interaction. Real Saturday and Sunday headings and cells
SHALL use a stable theme-aware light rose treatment. A current weekend SHALL retain that rose
surface while the signal date badge remains the dominant current-day cue. A day-dialog title SHALL
preserve locale order while omitting the abbreviated Russian year suffix. Previous and Next
navigation SHALL use the reviewed labels from the active catalog.

#### Scenario: Empty and populated dates
- **WHEN** one empty date and one event date render in the same month
- **THEN** both keep aligned numbers while only the event date is an actionable button with hover feedback

#### Scenario: Activate an empty date
- **WHEN** a user clicks or presses an in-month date with no birthday or dated Tag assignment
- **THEN** no day dialog opens and no Calendar state changes

#### Scenario: Weekend dates
- **WHEN** a displayed date falls on Saturday or Sunday
- **THEN** its weekday heading and cell use the same restrained rose family in both themes

#### Scenario: Current weekend date
- **WHEN** today falls on a weekend in the displayed month
- **THEN** the cell retains weekend context and the date badge remains clearly current

#### Scenario: Current date
- **WHEN** the displayed month contains today
- **THEN** today's date badge and cell treatment remain clearly distinguishable in either theme

#### Scenario: Russian month heading
- **WHEN** the Russian interface displays August 2026
- **THEN** the heading contains only the localized month name and numeric year, without an
  abbreviated or full year suffix

#### Scenario: Open localized date details
- **WHEN** a user opens a populated day in any supported locale
- **THEN** the title follows that locale and contains no obsolete Russian year suffix

#### Scenario: Navigate in Russian
- **WHEN** Russian Calendar navigation is exposed
- **THEN** its backward and forward controls use the reviewed Russian catalog labels

### Requirement: Calendar day Employee rows support catalog actions
The Calendar day dialog SHALL omit its redundant descriptive label, SHALL render its Employee list
without extra outer horizontal padding, and SHALL expose the same tag, edit, and delete actions as
the ordinary Employee catalog. The open day SHALL re-derive Employees from current indexes after a
mutation.

#### Scenario: Manage birthday Employee
- **WHEN** a user opens a day with a birthday Employee
- **THEN** the row exposes tag, edit, and delete actions aligned on the right without extra list-side
  padding

#### Scenario: Employee mutation updates open day
- **WHEN** an Employee is edited or deleted from the Calendar day dialog
- **THEN** the current dialog list reflects the updated indexes without a stale Employee snapshot

#### Scenario: Calendar day dialog heading
- **WHEN** a Calendar day dialog opens
- **THEN** the date remains its title and no “Birthdays and dated tags for this day” description is
  rendered

### Requirement: Units detail counts follow the Employee catalog pattern
The selected Unit detail pane SHALL omit redundant direct-Employee and descendant-Employee section
labels and SHALL show the current Employee count in a compact line directly below search. Direct and
descendant Employees SHALL render as one contiguous virtualized list. The count SHALL update from the
current Unit membership and localized plural rules after search, assignment, edit, or deletion.

#### Scenario: Selected Unit Employee count
- **WHEN** a selected Unit contains direct or descendant Employees
- **THEN** one localized Employee count appears below search and no roster-section summary appears above or within the list

#### Scenario: Mixed selected Unit roster
- **WHEN** a selected Unit contains both direct and descendant Employees
- **THEN** their Employee cards retain the existing group order inside one contiguous virtualized list without a section header

#### Scenario: Unit membership changes
- **WHEN** an Employee is assigned, edited, or removed while the Unit remains selected
- **THEN** the count and visible list update from current membership without a stale snapshot

### Requirement: Calendar tag dialogs use complete Employee rows
The Calendar dated-tag dialog SHALL omit its redundant event-count description and SHALL render
each matching Employee with the complete catalog row presentation and the same right-aligned Tag,
Edit, and Delete actions as ordinary Employee lists. The open dialog SHALL re-derive its rows from
current indexes after a mutation and preserve bounded scrolling.

#### Scenario: Open a populated dated-tag dialog
- **WHEN** a user opens a dated-tag group containing one or more Employees
- **THEN** no dated-tag event-count description is rendered and every Employee row exposes complete identity content and right-aligned actions

#### Scenario: Mutate an Employee from a dated-tag dialog
- **WHEN** a user tags, edits, or deletes an Employee from the open dialog
- **THEN** the dialog and Calendar re-derive their current rows and counts without stale Employee data

### Requirement: Editor export shares structured output behavior
The Editor export dialog SHALL offer Image, JSON, and Template formats. JSON and Template SHALL use
the same schemas, unified sortable top-level field list, nested field ordering, validation, naming,
tokens, fixed Unit-path separator, bounded previews, shared Template row-mode control, and local
generation behavior as Data Download while retaining independent session-local settings. The
selected Unit-only or subtree scope SHALL determine both the Employees and the Unit assignments
available to structured output; assignments outside that scope MUST NOT appear. Unit-only and
subtree scope controls SHALL include thematic leading icons.

#### Scenario: Export scoped JSON
- **WHEN** a user reorders fields and exports JSON for one Unit or a subtree
- **THEN** each scoped Employee appears once with keys in the configured order and contains only retained assignments inside the selected scope

#### Scenario: Exclude every scoped assignment
- **WHEN** exclusions remove every scoped Unit assignment for an otherwise included Employee
- **THEN** the Employee remains and the enabled Unit collection is an empty array

#### Scenario: Export a scoped template
- **WHEN** a scoped Employee belongs to multiple scoped Units and the user selects a Template row mode
- **THEN** the common visual control and Template formatter produce All Units or First Unit rows from only that scope

#### Scenario: Identify export scope
- **WHEN** the scope selector renders Unit-only and entire-subtree actions
- **THEN** each label follows a thematic icon without changing selection geometry

#### Scenario: Preserve image export
- **WHEN** the user selects Image
- **THEN** the local bounded inline PNG preview, customization, copy, and save behavior remains available

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

### Requirement: Expanded Unit cards summarize direct Tags
An expanded Unit with tagged direct Employees and enabled View Tag cloud visibility SHALL render a compact borderless tonal footer after
its Employee list. The footer SHALL show every catalog-ordered Tag as a filled wrapping chip with its
complete label and unique direct-Employee count. Short chips SHALL be content-sized with equal
compact insets. A long chip SHALL use no more than the footer width, wrap by words and then grapheme
clusters, and keep the `middle dot + count` suffix unbroken on the last fitting line or its own line.
Ellipsis MUST NOT be used. One deterministic shared layout SHALL drive DOM rendering, PNG rendering,
Unit height, bounds, connections, spatial indexing, snapping, and collision geometry. Descendants
SHALL NOT contribute. Live Units SHALL use their resolved direct membership. Dates SHALL NOT split a
Tag count. Collapsed and tagless Units, and all Units in a View with Tag cloud visibility disabled, SHALL have no footer or reserved footer height.

#### Scenario: Count manual Unit Tags
- **WHEN** direct Employees in a manual Unit share one or more Tags
- **THEN** each Tag footer chip shows the number of distinct direct Employees with that Tag

#### Scenario: Exclude descendants
- **WHEN** only Employees in descendant Units carry a Tag
- **THEN** the parent Unit footer does not show or count that Tag

#### Scenario: Size chips by content
- **WHEN** footer Tags have labels and counts of different lengths
- **THEN** every short chip uses the same compact insets and only the width required by its own content

#### Scenario: Wrap a long multilingual Tag
- **WHEN** a Latin, Cyrillic, Arabic, CJK, or emoji Tag is wider than the footer
- **THEN** its complete label wraps without an ellipsis and its count suffix remains indivisible

#### Scenario: Wrap many Tags
- **WHEN** measured Tag chips exceed the Unit width
- **THEN** all chips wrap to additional rows and the Unit height, bounds, connections, and collision geometry expand by the shared measured footer height

#### Scenario: Export the footer
- **WHEN** Editor PNG is rendered for a Unit with a Tag footer
- **THEN** the same complete Tag labels, counts, colors, compact widths, line wrapping, and geometry appear in the image

#### Scenario: Hide the View Tag cloud
- **WHEN** Show Tag cloud is disabled
- **THEN** every canvas and PNG Unit omits its footer and uses zero footer height while Employee Tags and counts remain unchanged

### Requirement: Unit deletion produces one valid final state
Every keyboard, context-menu, Editor, and Units-surface deletion SHALL use one coordinator. The
coordinator SHALL delete a deduplicated descendant closure, materialize remaining Live Units that
reference deleted Units with their pre-delete visible direct membership, and remove all deleted IDs
from Editor selection, system Unit selection and expansion, Unit filters, and active Download
selection, filters, and exclusions before persistence can observe the result. System selection SHALL
fall back to its closest surviving ancestor, then the first surviving root, then `null`.

#### Scenario: Delete an ancestor and selected descendants
- **WHEN** the selected deletion set contains a parent, one of its descendants, and Units from another branch
- **THEN** every affected Unit is deleted exactly once and the resulting strict state contains no stale Unit reference

#### Scenario: Materialize a dependent Live Unit
- **WHEN** a surviving Live Unit references a Unit in the deletion closure
- **THEN** it becomes static with its visible direct membership from immediately before deletion

#### Scenario: Persist only a valid deletion
- **WHEN** deletion completes
- **THEN** change notification and automatic persistence run only after organization and bounded UI projections validate together

### Requirement: Editor note interaction preserves canvas rendering
The Editor SHALL expose Unit notes without including the note action or note content in PNG output,
Unit geometry, spatial indexing, snapping, connections, or collision resolution. Closed note
content MUST NOT be parsed during canvas rendering.

#### Scenario: Render a canvas with notes
- **WHEN** visible Units contain saved notes but no note dialog is open
- **THEN** Unit geometry matches note-free cards and no Markdown parser processes their content

#### Scenario: Export a noted Unit to PNG
- **WHEN** the user exports a Unit or subtree containing notes as an image
- **THEN** the PNG contains the existing organization card content without note icons or Markdown

### Requirement: Editor geometry supports bounded distribution overlays
The Editor SHALL derive distribution row anchors from its existing deterministic Employee row
layout and SHALL cull connection paths against the visible world without adding overlay geometry to
Unit bounds, snapping, collision handling, or the Unit spatial index.

#### Scenario: Target row is virtualized
- **WHEN** a selected Employee's target row is outside the mounted virtual row range
- **THEN** its anchor is computed from cached row offsets without mounting or measuring that row

#### Scenario: Selection changes on a large View
- **WHEN** selection changes with 4,000 Units present
- **THEN** the Editor reads only the selected Employee's cached memberships and does not scan every Unit

### Requirement: Employee placement navigation preserves Editor interaction geometry
The Editor SHALL compose a multi-placement Employee row from a primary drag/select button and a
separate fixed-size placement action. The action and its transient map MUST NOT change Employee row
height, Unit bounds, snapping, spatial indexes, hierarchy connections, report output, or drag
behavior. Navigation SHALL reuse the Editor's exact Employee occurrence reveal and centering flow.

#### Scenario: Render a placement action
- **WHEN** a visible Employee belongs to more than one direct Unit
- **THEN** the row retains its deterministic height and exposes a separate action at the logical end

#### Scenario: Activate the row action
- **WHEN** the placement action receives pointer or keyboard activation
- **THEN** it opens the map without selecting, dragging, or opening the Employee context menu

#### Scenario: Center a collapsed occurrence
- **WHEN** placement navigation targets an Employee hidden by a collapsed Unit
- **THEN** the Unit expands before the exact row is selected and centered

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

### Requirement: Every hierarchy count is a unique subtree total
The total for each Unit SHALL be the number of distinct Employee IDs in its own direct membership and all descendants. An Employee present in an ancestor MUST remain included in this Unit's count. Bosses SHALL follow the same ID deduplication rule. Manual and resolved Live membership SHALL count. Direct totals SHALL count distinct own IDs. Canvas, PNG, Units, selection trees, and export source trees SHALL follow this rule independently of collapse, search, Tag grouping, or distribution mode.

#### Scenario: Count repeated memberships at every level
- **WHEN** root contains E1, child contains E1 and E2, and grandchild contains E1 and E3
- **THEN** root and child totals are three and grandchild total is two, regardless of boss roles

#### Scenario: Count sibling overlap
- **WHEN** the same Employee is assigned to multiple descendants or Live Units
- **THEN** each Unit includes that Employee once in its own subtree and PNG matches the canvas calculation

### Requirement: View settings control Unit presentation
Every View SHALL expose a toolbar settings gear opening Unit display and Distribution mode sections.
Unit display SHALL offer Group by tag and Show Tag cloud switches, both enabled by default. Unit
cards MUST NOT retain a settings gear; their note action SHALL occupy the free upper corner.
Each change SHALL apply immediately as one View-local undoable command. Closing the dialog SHALL
restore focus; changing or deleting its View SHALL close it safely.

#### Scenario: Configure an empty or system View
- **WHEN** the active View is system, custom, or empty
- **THEN** its accessible toolbar settings action remains available

#### Scenario: Group all Units
- **WHEN** View grouping is enabled
- **THEN** every manual and Live Unit shows its boss once first, then Employees grouped once by earliest catalog Tag, with stable full-name/ID order within groups and untagged Employees last without separators

#### Scenario: Disable grouping
- **WHEN** View grouping is disabled
- **THEN** every Unit shows its boss first followed by one stable alphabetic list and one Undo restores grouping

#### Scenario: Share row order
- **WHEN** grouping changes or the Tag catalog is reordered
- **THEN** canvas, PNG, virtualization, navigation, and distribution anchors use the same resulting row sequence

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

### Requirement: Editor interaction work remains isolated from stable scene content
The Editor SHALL preserve complete interactive and visual behavior while keeping transient viewport,
gesture, and rich-text work proportional to the visible or directly affected scene. Pan and zoom
SHALL update the live world transform at most once per animation frame without re-rendering stable
Unit or canvas-element nodes. The mounted scene SHALL cover the complete visible viewport and MAY
reuse a bounded overscanned render window until the viewport leaves that window. Unit and
canvas-element gestures SHALL update only the selected owners, their attachment-dependent closure,
and the required interaction overlays before the single durable commit. The Editor SHALL NOT hide,
rasterize, or simplify stable content to meet this requirement.

#### Scenario: Pan inside the buffered render window
- **WHEN** repeated pointer samples pan a large annotated View without crossing its buffered render
  window
- **THEN** the world transform and grid follow the latest animation-frame sample
- **AND** stable Unit, connection, Text, Sticker, Image, and Arrow nodes do not re-render
- **AND** no rich-text layout or durable write occurs before release

#### Scenario: Pan or zoom crosses the buffered window
- **WHEN** the visible viewport would leave the current overscanned render window
- **THEN** the Editor queries a replacement window before visible content can be omitted
- **AND** the replacement is derived from spatial indexes rather than full per-frame collection
  scans

#### Scenario: Canvas gesture affects an attachment closure
- **WHEN** a Unit or canvas element moves, resizes, rotates, or changes an Arrow endpoint
- **THEN** transient rendering updates the selected objects, their dependent attachments, and the
  active overlays without invalidating unrelated scene nodes
- **AND** completion creates no more than one existing history command and persistence notification

### Requirement: Editor rich text reuses bounded local layout work
Text and Sticker rendering SHALL use one canonical rich-text layout behavior across resting DOM,
editing DOM, bounds, anchors, and Editor PNG. The interactive runtime SHALL reuse font measurements
and completed layouts until layout-affecting content, typography, geometry, or local font readiness
changes. Caches SHALL be bounded and local to the application runtime. Active editing SHALL keep its
draft and selection transient, coalesce layout work to animation frames, preserve plain-text paste,
IME, partial formatting, and Escape/blur semantics, and commit at most once.

#### Scenario: Viewport changes after editing long text
- **WHEN** a Text or Sticker containing up to 64 KiB has a current completed layout and the user pans
  or zooms the View
- **THEN** the Editor reuses that layout without re-segmenting or remeasuring the text
- **AND** DOM and PNG retain the same lines, fragments, fills, bounds, fonts, and alignment

#### Scenario: User edits one rich-text range
- **WHEN** input, paste, composition, deletion, or toolbar formatting changes one range
- **THEN** only the active draft and its affected layout work update during editing
- **AND** unrelated Units and canvas elements retain their render and layout revisions
- **AND** finishing the edit creates one history command and one synchronization

#### Scenario: A bundled font becomes ready
- **WHEN** a local font request used by Text or Sticker finishes loading
- **THEN** only elements that use that request invalidate their measured layout
- **AND** no remote font request, telemetry, or organization-data persistence occurs

### Requirement: Large annotated Editor Views have a measurable performance contract
The maintained large Editor scenario SHALL cover 20,000 Employees, 4,000 expanded Units, at least
1,200 Text, Sticker, and Arrow elements, attachments, and maximum-size rich text in both server and
Pages runtimes. Local test diagnostics SHALL expose numeric render, layout, measurement, and
invalidation counts without organization content, persistence, or network transmission. After
warm-up, the scenario SHALL target 60 frames per second, gate the 95th-percentile animation-frame
interval at 33 milliseconds, reject an interaction pause above 100 milliseconds, and gate the
95th-percentile long-text input-to-next-paint delay at 50 milliseconds.

#### Scenario: Large View interaction regression test
- **WHEN** automated browser coverage pans, zooms, edits long rich text, and transforms canvas
  elements in the maintained large annotated View
- **THEN** deterministic counters prove that unrelated scene and layout work did not run
- **AND** measured frame and input delays remain within the maintained coarse budgets
- **AND** preview writes remain absent and each completed operation retains its existing single-write
  contract

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

### Requirement: Open positions participate in Editor row geometry and Tags

Employee and open-position rows SHALL use one discriminated ordered layout with measured Tag-chip
heights and prefix offsets for DOM rendering, virtualization, bounds, hit testing, Unit layout, and
canvas anchors. Boss Employees SHALL remain first; other rows SHALL follow active Tag grouping,
display name or title, and stable ID. Open-position Tags SHALL affect row ordering and display but
MUST NOT affect Employee counts, distribution state, or Unit Tag-cloud summaries. Collapse SHALL
hide positions and retain a deterministic Unit-edge fallback for their anchors.

#### Scenario: Group a tagged position
- **WHEN** Group by tag is enabled for a manual Unit containing Employees and tagged open positions
- **THEN** all rows follow the shared deterministic order while Employee counts and Tag-cloud counts
  remain based only on distinct Employees

#### Scenario: Virtualize a large mixed roster
- **WHEN** a Unit contains enough Employee and open-position rows to cross the virtualization limit
- **THEN** only the visible row window mounts while bounds, pointer hit testing, and anchors use the
  complete cached prefix-offset layout

#### Scenario: Collapse an attached position
- **WHEN** a canvas element targets an open-position side anchor and the Unit collapses
- **THEN** the target resolves to the corresponding Unit edge without losing its persistent link

### Requirement: Open positions support replacement and deletion

An open-position context menu SHALL expose Edit, Replace with Employee, and Delete. Replacement
SHALL use a single-select Employee picker. Picker replacement SHALL add the chosen Employee to the
target Unit without removing other occurrences; dropping exactly one Employee occurrence from
another manual Unit SHALL use existing move semantics. Both paths MUST atomically remove the
position, select the resulting Employee occurrence, and rekey all position attachments without
changing their world geometry. Position Tags MUST NOT modify the Employee. Multi-Employee drops
MUST use the ordinary Unit drop without consuming a position.

#### Scenario: Replace from the picker
- **WHEN** a user chooses one Employee in Replace with Employee
- **THEN** the Employee occurs in the target Unit, remains in every other Unit, the position is
  removed, its attachments target the Employee occurrence, and Undo restores the complete prior state

#### Scenario: Replace by dragging one Employee
- **WHEN** one Employee occurrence from another manual Unit is dropped on an open position
- **THEN** the occurrence moves using the existing boss and position rules, consumes the open
  position, and preserves attached canvas geometry as one command

#### Scenario: Replace with an existing target Employee
- **WHEN** the chosen Employee already occurs in the target Unit
- **THEN** only the position is removed and its attachments are rekeyed to the existing occurrence

#### Scenario: Delete an attached position
- **WHEN** a selected open position is deleted from its context menu or the keyboard
- **THEN** it is removed and incoming canvas attachments detach at their last resolved world
  coordinates in the same undoable command

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
