# organization-editor Specification

## Purpose
Define the retained editor surfaces, View isolation, and birthday-driven product behavior.
## Requirements
### Requirement: The generic editor retains six product surfaces
The application SHALL provide localized Units, Employees, Editor, Analytics, Calendar, and Download
surfaces in that visual and keyboard order, with Editor active for a blank workspace, no visible
wordmark or brand icon, and consistent actionable top-level empty states. A populated Employees
surface SHALL show the total catalog count below search and SHALL additionally show the visible match
count only while search or filters are active. The populated Org Editor SHALL place View management,
layout, hierarchy, and search controls in one compact top-left toolbar surface and viewport controls
in one compact bottom-left toolbar surface. The Editor canvas SHALL retain a distinct neutral-gray
background while the sidebar, context header, and ordinary workflows use the layered shell system.
Selected Team nodes SHALL retain the same opaque background as their resting state and communicate
selection only through the existing semantic boundary. The View selector SHALL use the shared styled
Select surface and indicator. Arrange and hierarchy commands SHALL use normal text weight and place
their thematic icon after the label. Closing Editor Search SHALL clear its query, and an empty query
SHALL render no explanatory result surface.

#### Scenario: Product navigation order
- **WHEN** the product shell renders in either locale
- **THEN** Download is the final tab after Calendar in both DOM and keyboard navigation order

#### Scenario: Empty workspace navigation
- **WHEN** the workspace has no Units or Employees in either supported locale
- **THEN** each tab remains reachable and shows the shared localized empty layout without controls that require absent data

#### Scenario: Feature-specific empty data
- **WHEN** Download or Analytics has no Employees or Calendar has no birthdays or dated tags
- **THEN** the surface omits its data chrome and offers one relevant action through the header or shared empty layout

#### Scenario: Empty Org Editor
- **WHEN** the active View contains no Units
- **THEN** layout and zoom controls are absent, an add-to-canvas action is available, and View management remains only when multiple Views require it

#### Scenario: Localized active View label
- **WHEN** the Org Editor displays the built-in Main View in either supported locale
- **THEN** the localized label remains fully visible on one line inside the shared styled View selector without overlapping adjacent controls
- **AND** longer user-authored View names remain contained with a single-line ellipsis

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
- **WHEN** the active View contains Units
- **THEN** View selection and actions, layout, arrange, hierarchy, and Search appear in one compact
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
- **WHEN** a View contains 4,000 Units and the viewport changes
- **THEN** visible Unit and connection candidates come from the intersecting spatial buckets without a full-collection scan per frame

### Requirement: Main and custom Views remain independent
The editor SHALL preserve the canonical Main View, custom Views, Live Units, undo/redo, drag-and-drop, layout, and viewport isolation.

#### Scenario: Custom View edit
- **WHEN** a global Employee or Unit is edited only in a custom View
- **THEN** the Main View remains unchanged

### Requirement: Calendar and analytics use normalized birthdays
The application SHALL use nullable `MM-DD` birthdays for Calendar and birthday analytics, SHALL
navigate a selected month and year across year boundaries, SHALL project February 29 birthdays to
February 28 in non-leap years, SHALL include exact-date global Main Employee tag events, SHALL fit a
31-day grid and bounded tag cloud without page scroll at the maintained 1280 by 720 desktop
viewport, and SHALL render Analytics as six content-sized groups in one full-bleed workflow with
compact gaps and one uniform soft tonal surface per group. Groups SHALL add no outer
border, shadow, nested header fill, or repeated row rule.
Each Analytics group SHALL show at most eight estimated 42 px rows before using its existing
virtualized internal scroll container.

#### Scenario: Birthday display
- **WHEN** an Employee has a valid birthday and the calendar displays the corresponding year and month
- **THEN** the Employee appears on the matching day, using February 28 for a February 29 birthday in a non-leap year, and in birthday aggregates

#### Scenario: Calendar navigation layout
- **WHEN** Calendar has birthday or dated-tag data on a maintained desktop viewport
- **THEN** its header shows month and year followed by Previous and Next, and the remaining cloud and grid fit without horizontal or vertical page overflow

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
The Calendar SHALL show exact-date tag events separately from birthday avatars, limit a day cell to
two inline tag events plus an overflow count, and open a localized day dialog containing only
populated Birthday and dated-event content. Dated-event details SHALL omit a redundant section
heading and SHALL use complete shared Employee cards with right-aligned Tag, Edit, and Delete
actions while keeping every event label available for tag-history navigation.

#### Scenario: Open a populated day
- **WHEN** a user activates a day containing birthdays and dated tags
- **THEN** the dialog lists both populated content groups with their Employees and labels
- **AND** dated events use complete actionable Employee cards without a Dated tags heading

#### Scenario: Open tag history from a day
- **WHEN** a user activates a dated-event label within an Employee card
- **THEN** the Calendar opens that label's current, future, and conditional past event history

### Requirement: Calendar provides a bounded dated-tag cloud
The Calendar SHALL show all dated tag labels from global Main Employees as localized chips with event counts in at most two rows, disclose overflow without expanding the page, and open a virtualized dialog for the selected label.

#### Scenario: Open a tag from the cloud
- **WHEN** a user activates a dated-tag cloud chip
- **THEN** current and future events appear in ascending date order and past events appear separately in descending date order with localized dates and Employees

#### Scenario: Calendar empty state
- **WHEN** no global Main Employee has either a birthday or a dated tag
- **THEN** the shared Calendar empty state is shown instead of the cloud and grid

### Requirement: Calendar dated-tag counts use uniform separators
The Calendar tag cloud SHALL render each dated-tag label, one shared middle-dot separator, and its
localized count as distinct aligned elements with the same horizontal separator spacing for every
tag length and count.

#### Scenario: Dated-tag cloud spacing
- **WHEN** the Calendar renders multiple dated-tag groups with different label lengths and counts
- **THEN** every middle dot has the same computed left and right spacing and the label and count remain vertically aligned

### Requirement: Org Editor Employee geometry follows wrapped tags
The Org Editor SHALL compute Employee row heights from all rendered localized tag chips and SHALL
use shared prefix offsets for virtualization, hitboxes, selection, connectors, layout, and bounds.
The PNG renderer SHALL draw every localized tag as a compact neutral chip matching the on-screen
Employee-card treatment, including rounded geometry, typography, wrapping, and `label · date`
content, and SHALL use the same packing dimensions for drawing and row-height growth without hidden
tags or unused tag-row space.

#### Scenario: Tag rows change
- **WHEN** Employee tags or the active locale changes the packed chip rows
- **THEN** measurements are invalidated and every downstream canvas geometry consumer uses the updated offsets without overlap

#### Scenario: Large View virtualization
- **WHEN** a large View contains variable-height Employee rows
- **THEN** only visible rows render while hit testing and connector anchors remain aligned with their Employees

#### Scenario: Export Employee tags to PNG
- **WHEN** an Employee with dated or undated tags is included in an Org Editor PNG export
- **THEN** every tag appears as a wrapped neutral chip with card-consistent text, padding, radius, and compact row gaps
- **AND** dated tags use a localized date after a middle dot without bright blue styling or reserved empty rows

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

### Requirement: Employee and Unit forms avoid redundant chrome
Employee create and edit forms SHALL expose a Gender selector and SHALL omit visible storage-scope
and avatar-format helper paragraphs. The Unit form SHALL omit a visible Membership mode label while
retaining an accessible name on the mode switch.

#### Scenario: Create or edit Employee
- **WHEN** the Employee form opens
- **THEN** it offers Male, Female, and Not specified gender values without the storage or
  avatar-format helper paragraphs

#### Scenario: Choose Unit membership mode
- **WHEN** the Unit form renders Static and Live tabs
- **THEN** no redundant Membership mode heading is visible and assistive technology still receives
  the localized mode-switch name

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
The Calendar SHALL format its heading as a localized month name followed by a bare numeric year,
SHALL render every in-month date as a pointer and keyboard button with the date number fixed in the
same top row, SHALL provide tonal hover and focus feedback, and SHALL distinguish the current date
with a stronger signal treatment than ordinary dates.

#### Scenario: Empty and populated dates
- **WHEN** one empty date and one event date render in the same month
- **THEN** both are actionable buttons with their date numbers aligned to the same top position and
  both expose pointer hover feedback

#### Scenario: Current date
- **WHEN** the displayed month contains today
- **THEN** today's date badge and cell treatment remain clearly distinguishable in either theme

#### Scenario: Russian month heading
- **WHEN** the Russian interface displays August 2026
- **THEN** the heading contains only the localized month name and numeric year, without an
  abbreviated or full year suffix

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
The selected Unit detail pane SHALL omit the redundant direct-Employee descriptive label and SHALL
show the current Employee count in a compact line directly below search. The count SHALL update from
the current Unit membership and localized plural rules after search, assignment, edit, or deletion.

#### Scenario: Selected Unit Employee count
- **WHEN** a selected Unit contains Employees
- **THEN** one localized Employee count appears below search and no direct-Employee summary appears above the list

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

### Requirement: Applied agent changes update the live organization safely
An MCP Apply SHALL update the persisted singleton state once and notify open server-mode editors.
The editor SHALL rehydrate affected Employees, Units, assignments, hierarchy, geometry, Main or
custom Views, derived indexes, and durable selections from the validated current revision without a
reload. Independent local edits SHALL survive automatic three-way merge; overlapping edits MUST
remain visible in memory until the user resolves them.

#### Scenario: Agent creates a planning View
- **WHEN** MCP applies a Main-derived custom View while the Editor is open
- **THEN** the new View and its exact structure become selectable without reloading or changing Main

#### Scenario: Agent updates active structure
- **WHEN** MCP applies Employee, Unit, hierarchy, assignment, or geometry changes visible in the active workflow
- **THEN** current lists, canvas, Analytics, Calendar, and derived counts update from the new revision

#### Scenario: Independent user edit
- **WHEN** a pending local edit and MCP Apply affect disjoint stable values
- **THEN** both changes remain in the live validated organization after reconciliation

#### Scenario: Overlapping editor edit
- **WHEN** a pending local edit and MCP Apply affect the same stable value
- **THEN** the editor shows localized Keep local, Use MCP, and Cancel choices without changing the local value silently

### Requirement: Agent operations preserve editor invariants
Agent-created or updated Views and Units SHALL follow the same identifier, reference, hierarchy,
membership, position, geometry, Main/custom isolation, and adaptive 24-unit grid invariants as
interactive editor commands. Full structure replacement SHALL be atomic and MUST NOT leave dangling
durable UI references.

#### Scenario: Agent geometry
- **WHEN** an agent previews explicit Unit movement or arrangement
- **THEN** every produced Unit origin is normalized to the shared 24-unit grid before the preview is valid

#### Scenario: Invalid graph
- **WHEN** agent operations create a hierarchy cycle, dangling assignment, invalid Live rule, or duplicate stable ID
- **THEN** Preview rejects the complete batch and neither the live editor nor SQLite changes

#### Scenario: Delete selected entity
- **WHEN** Apply validly deletes an entity referenced by durable selection or expansion state
- **THEN** the structural deletion commits and dangling UI references are filtered in the resulting state
