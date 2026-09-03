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
animation frame. Pan, zoom, and Unit drag SHALL preview without mutating the durable viewport or
document on every pointer event. The final gesture SHALL commit at most one viewport update or one
organization command. Viewport visibility SHALL use a geometry index built only when Unit bounds
change rather than scanning every Unit on each interaction frame.

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
heading followed by complete shared Employee cards. Dated groups SHALL sort by localized label,
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
An expanded Unit with tagged direct Employees SHALL render a compact borderless tonal footer after
its Employee list. The footer SHALL show every catalog-ordered Tag as a filled wrapping chip with its
label and unique direct-Employee count. Each chip SHALL be content-sized from one deterministic
shared text metric with equal compact horizontal insets and SHALL NOT reserve a fixed trailing area
beyond its label and count. Descendants SHALL NOT contribute. Live Units SHALL use their resolved
direct membership. Dates SHALL NOT split a Tag count. Collapsed and tagless Units SHALL have no
footer.

#### Scenario: Count manual Unit Tags
- **WHEN** direct Employees in a manual Unit share one or more Tags
- **THEN** each Tag footer chip shows the number of distinct direct Employees with that Tag

#### Scenario: Exclude descendants
- **WHEN** only Employees in descendant Units carry a Tag
- **THEN** the parent Unit footer does not show or count that Tag

#### Scenario: Size chips by content
- **WHEN** footer Tags have labels and counts of different lengths
- **THEN** every chip uses the same compact insets and only the width required by its own content

#### Scenario: Wrap many Tags
- **WHEN** measured Tag chips exceed the Unit width
- **THEN** all chips wrap to additional rows and the Unit height, bounds, connections, and collision geometry expand by the shared measured footer height

#### Scenario: Export the footer
- **WHEN** Editor PNG is rendered for a Unit with a Tag footer
- **THEN** the same Tag labels, counts, colors, compact widths, wrapping, and geometry appear in the image
