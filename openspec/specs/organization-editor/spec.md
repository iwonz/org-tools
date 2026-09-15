# organization-editor Specification

## Purpose
Define the current organization Editor, its retained interactions, and birthday-driven product behavior.
## Requirements
### Requirement: The generic editor retains six product surfaces
The application SHALL provide localized Units, Employees, Editor, Analytics, Calendar, and Download
surfaces in that visual and keyboard order, with Editor active for a blank workspace, no visible
wordmark or brand icon, and consistent actionable top-level empty states. A populated Employees
surface SHALL show the total catalog count below search and SHALL additionally show the visible match
count only while search or filters are active. The populated Editor SHALL place layout, hierarchy,
and search controls in one compact logical-end toolbar surface, a View selector and lifecycle actions
beside separate history controls at the logical start, and viewport controls in one compact
bottom-left toolbar surface. Editor and Units SHALL operate on the same Unit document only while the
system View is active; custom Views SHALL keep independent Unit documents over the global Employee
catalog. The Editor canvas SHALL retain a distinct neutral-gray background while the sidebar,
context header, and ordinary workflows use the layered shell system. Selected Team nodes SHALL
retain the same opaque background as their resting state and communicate selection only through the
existing semantic boundary. Arrange and hierarchy commands SHALL use normal text weight and place
their thematic icon before the label. Closing Editor Search SHALL clear its query, and an empty query
SHALL render no explanatory result surface.

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
- **THEN** layout and zoom controls are absent while View management and one add-to-canvas action remain available

#### Scenario: Sidebar application shell
- **WHEN** the product shell renders in light or dark theme
- **THEN** one dark 240 px sidebar contains the six product destinations followed by Import, Export,
  locale, and theme controls without a visible wordmark or Org Tools title
- **AND** one 64 px content header contains the active workflow icon, localized title, and at most one contextual workflow action

#### Scenario: Narrow application shell
- **WHEN** the viewport is narrower than 1024 px
- **THEN** the sidebar uses a 64 px icon rail whose controls hide visible labels while retaining
  localized accessible names and tooltips
- **AND** the workspace and icon-only context action remain contained without page-level overflow or changing navigation order

#### Scenario: Populated Employee catalog count
- **WHEN** the Employees surface contains Employees and no search or filter is active
- **THEN** the localized total Employee count appears below the search field without a redundant Employees heading

#### Scenario: Filtered Employee catalog count
- **WHEN** Employee search or filters are active
- **THEN** the count line keeps the localized total Employee count and adds the localized visible match count

#### Scenario: Editor control surfaces
- **WHEN** current Units exist
- **THEN** layout, arrange, hierarchy, and Search appear in one compact
  top-left surface with an adaptive tonal background, radius, and padding
- **AND** zoom out, zoom in, scale reset, and primary-Team focus appear in one compact bottom-left surface with the same treatment
- **AND** individual resting controls and both toolbar groups add no decorative border or shadow

#### Scenario: Editor search placement
- **WHEN** Search is the final control in the top-left group and the user opens it
- **THEN** the field appears to the right of its trigger while the complete group remains within the viewport
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

### Requirement: The Editor exposes accessible View management
The Editor SHALL show a styled View Select and Create action in every canvas state. Custom Views
SHALL also expose Rename and Delete actions, while Undo/Redo remain a separate adjacent surface.
Create SHALL accept a name and either Blank or Copy with any current View as source.

#### Scenario: Manage an empty custom View
- **WHEN** an active custom View contains no Units
- **THEN** its Select, Create, Rename, and Delete controls remain available

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
The Editor SHALL preserve the compact two-icon layout control while providing separate accessible pressed buttons for top-down and left-to-right direction. Selecting a different direction SHALL invoke the existing undoable arrangement command once. Selecting the active direction MUST NOT change state or geometry. The separate Arrange command SHALL remain available.

#### Scenario: Select one direction explicitly
- **WHEN** a user clicks or keyboard-activates a direction button
- **THEN** that direction becomes active and repeated activation is a no-op

#### Scenario: Undo a direction change
- **WHEN** the user changes direction and then performs Undo
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

### Requirement: Editor exports one complete View image
The Editor SHALL provide an image-only full-View export dialog whose scene contains every Unit,
hierarchy connection, and durable canvas element regardless of viewport. Collapsed cards SHALL keep
their collapsed roster/footer presentation while descendant Units remain part of the structural
scene. The dialog SHALL retain background, padding, title, title font/size/alignment, Unit radius,
Employee format, and boss-label controls; it SHALL add 1x, 2x, and 3x density with 2x default and
display the final pixel dimensions and effective density before Copy or Save. Its Employee format
SHALL use the shared token-aware Format input with `@` suggestions and documented `?` conditional
expressions. Its footer Copy and Save actions SHALL use the same clipboard and download icons as the
scoped Editor Image export dialog.

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
