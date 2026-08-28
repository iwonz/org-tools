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

#### Scenario: Product navigation order
- **WHEN** the product shell renders in either locale
- **THEN** Download is the final tab after Calendar in both DOM and keyboard navigation order

#### Scenario: Empty workspace navigation
- **WHEN** the workspace has no Units or Employees in either supported locale
- **THEN** each tab remains reachable and shows the shared localized empty layout without controls that require absent data

#### Scenario: Feature-specific empty data
- **WHEN** Download or Analytics has no Employees or Calendar has no birthdays or dated tags
- **THEN** the surface omits its data chrome and offers one relevant action through the shared empty layout

#### Scenario: Empty Org Editor
- **WHEN** the active View contains no Units
- **THEN** layout and zoom controls are absent, an add-to-canvas action is available, and View management remains only when multiple Views require it

#### Scenario: Localized active View label
- **WHEN** the Org Editor displays the built-in Main View in either supported locale
- **THEN** the localized label remains fully visible on one line inside the View selector without overlapping adjacent controls
- **AND** longer user-authored View names remain contained with a single-line ellipsis

#### Scenario: Sidebar application shell
- **WHEN** the product shell renders in light or dark theme
- **THEN** one dark 240 px sidebar contains the six product destinations followed by Import, Export,
  locale, and theme controls without a visible wordmark or Org Tools title
- **AND** one 64 px content header contains only the active workflow icon and localized title

#### Scenario: Narrow application shell
- **WHEN** the viewport is narrower than 1024 px
- **THEN** the sidebar uses a 64 px icon rail whose controls hide visible labels while retaining
  localized accessible names and tooltips
- **AND** the workspace remains contained without page-level overflow or changing navigation order

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
- **THEN** the field appears to the right of its trigger while the complete group and results remain within the viewport

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
The Calendar SHALL show exact-date tag events separately from birthday avatars, limit a day cell to two inline tag events plus an overflow count, and open a localized day dialog with Birthday and Dated tags sections.

#### Scenario: Open a populated day
- **WHEN** a user activates a day containing birthdays and dated tags
- **THEN** the dialog lists both event sections with their Employees and labels

### Requirement: Calendar provides a bounded dated-tag cloud
The Calendar SHALL show all dated tag labels from global Main Employees as localized chips with event counts in at most two rows, disclose overflow without expanding the page, and open a virtualized dialog for the selected label.

#### Scenario: Open a tag from the cloud
- **WHEN** a user activates a dated-tag cloud chip
- **THEN** current and future events appear in ascending date order and past events appear separately in descending date order with localized dates and Employees

#### Scenario: Calendar empty state
- **WHEN** no global Main Employee has either a birthday or a dated tag
- **THEN** the shared Calendar empty state is shown instead of the cloud and grid

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
