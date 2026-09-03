# interface-chrome Specification

## Purpose
Define the restrained layered shell, interaction states, workflow grouping, and overlay hierarchy.
## Requirements
### Requirement: Application chrome uses a restrained layered visual system
The application SHALL use a dark collapsible navigation sidebar, a compact workflow header outside
Editor, a low-contrast shell, full-bleed workflows, and restrained tonal grouping in light and dark
themes. Editor SHALL omit the shared 64 px header and use that height for its canvas. Primary,
focus, active, and semantic states SHALL retain the established utilitarian palette without remote
assets or requests.

The shared interaction signal SHALL use a restrained steel-blue hue, while larger active, selected,
and hover surfaces SHALL remain nearly neutral blue-gray rather than violet or lavender. The signal
SHALL NOT replace graphite primary actions or semantic destructive and calendar-event colors.

The interface SHALL use the locally bundled Noto Sans superfamily consistently: Noto Sans for
Latin/Cyrillic, Noto Sans SC for Simplified Chinese, and Noto Sans Arabic for Arabic. A font chosen
for an image-export artifact MAY differ only inside that artifact or preview.

#### Scenario: Light hierarchy
- **WHEN** a product workflow renders in the light theme
- **THEN** the header, full-bleed workflow, internal groups, and semantic controls are distinguishable
  through restrained tone, typography, alignment, and spacing without floating repeated rows

#### Scenario: Dark hierarchy
- **WHEN** a product workflow renders in the dark theme
- **THEN** the same hierarchy and interaction states remain legible without bright layout islands,
  lost boundaries, or reduced text contrast

#### Scenario: Local visual system
- **WHEN** the application loads or a visual state changes
- **THEN** fonts, icons, colors, and effects come from bundled assets and local code without a
  third-party request

#### Scenario: Editor canvas height
- **WHEN** Editor is active
- **THEN** the shared content header is absent and the canvas owns the released height

#### Scenario: Uniform locale typography
- **WHEN** headings, body text, placeholders, native controls, portals, or template inputs render
- **THEN** the active locale's bundled Noto family member is used consistently without remote fonts

#### Scenario: Utilitarian interaction palette
- **WHEN** the application renders focus, selection, active, or hover feedback in either theme
- **THEN** small signal details use restrained steel-blue and larger tonal surfaces use low-chroma
  blue-gray without a violet or lavender cast

### Requirement: Initial state loading is quiet and centered
While either runtime resolves its initial state, the application SHALL show one icon-only loading
indicator centered in the viewport on the normal shell background. The indicator SHALL have a
localized accessible status name, SHALL expose no visible loading copy, and SHALL use bundled CSS
and inline SVG with semantic theme tokens without decorative containers, shadows, or remote assets.

#### Scenario: Load initial state
- **WHEN** the SQLite or Pages runtime is waiting for its initial state
- **THEN** one compact circular indicator is centered on both viewport axes without visible text,
  cards, or product branding
- **AND** assistive technology receives the localized loading status

#### Scenario: Prefer reduced motion
- **WHEN** the operating environment requests reduced motion during initial state loading
- **THEN** the indicator remains visually identifiable and centered without requiring rotation

#### Scenario: Finish initial state loading
- **WHEN** the runtime installs a valid initial state or surfaces an explicit startup error
- **THEN** the transient loading indicator is removed without changing state, persistence, or error
  behavior

### Requirement: Navigation states are explicit and responsive
Product destinations SHALL retain accessible vertical tabs and the current order. The sidebar SHALL
initialize compact and own Import, Export, Language, and Theme actions. Language and Theme SHALL be
buttons opening separate modal dialogs rather than Select popovers. Compact actions SHALL show only
icons with localized names and direction-aware tooltips. Sidebar controls SHALL keep their existing
48 px width, 40 px height, padding, icon size, and borderless tonal interaction. The shell SHALL
render no decorative product glyph, visible product title, Save control, Autosave control, or
persistence status. Sidebar collapse and all other durable navigation context SHALL be represented
in the current state.
The 64 px context header SHALL reserve one right-aligned workflow action for populated or empty
Teams and Employees and for populated Download. The action SHALL keep its localized accessible name
and thematic icon at ordinary widths and SHALL become icon-only without overflow at narrow widths.
The icon SHALL lead by default; Download Continue SHALL explicitly place its arrow after the label.
Workflows SHALL NOT repeat that action inside their content or empty state.

#### Scenario: Initial blank sidebar
- **WHEN** a new blank state renders at desktop width
- **THEN** the sidebar starts as a 64 px compact icon rail and that durable mode can round-trip with the state

#### Scenario: Expanded and compact sidebar
- **WHEN** a desktop user toggles the sidebar mode
- **THEN** the right edge moves continuously between 240 and 64 px, icons keep one coordinate, and current product data remains unchanged

#### Scenario: Runtime sidebar actions
- **WHEN** either the SQLite or Pages runtime renders the sidebar
- **THEN** it exposes Import, Export, language, and theme in the same order without an agent, project, file, Save, or Autosave control

#### Scenario: Stable menu content
- **WHEN** theme, language, or another menu item is hovered, focused, selected, or pressed
- **THEN** its content position and geometry remain unchanged without a pointer-state border

#### Scenario: Open settings modal
- **WHEN** Language or Theme is activated
- **THEN** its independent modal opens above workflow controls without a dropdown surface

#### Scenario: Compact tooltip over Editor
- **WHEN** a compact navigation action is hovered while Editor is active
- **THEN** its tooltip is fully visible above canvas toolbars and below any open modal

#### Scenario: Responsive and RTL shell
- **WHEN** the shell renders at maintained widths or in Arabic RTL
- **THEN** actions remain reachable, logical placement mirrors, and controls do not overflow

#### Scenario: Responsive shell containment
- **WHEN** either runtime renders at 390, 1024, or 1280 px wide
- **THEN** global actions remain reachable, narrow layouts retain an icon rail, and the context action remains contained without consuming workflow width

#### Scenario: Workflow context actions
- **WHEN** Teams, Employees, or populated Download is active
- **THEN** the context header exposes exactly one localized primary action, with a leading icon for Add actions and a trailing arrow for Download Continue
- **AND** the workflow body and empty state contain no duplicate of that action

#### Scenario: Narrow workflow context action
- **WHEN** a header action renders at a narrow supported width
- **THEN** its visible label is hidden, its icon remains centered, and its accessible name and tooltip remain available

### Requirement: Product workflows use purposeful grouping
Teams, Employees, Analytics, Calendar, and Download SHALL render their primary task content
full-bleed without an outer panel border, radius, shadow, or shell-colored gap. Teams and Download
SHALL distinguish source and detail panes through tone, typography, and compact layout without a
decorative separator. Analytics SHALL group each metric table in one uniform soft tonal section
whose heading, column header, and row viewport do not stack competing neutral backgrounds or
outlines. Calendar SHALL group its header, Tag rail, and month grid through spacing and tone while
individual day cells keep semantic boundaries. The Editor SHALL retain an edge-to-edge neutral
canvas with floating toolbar surfaces and bounded data nodes.

#### Scenario: Split workflow
- **WHEN** populated Teams or Download renders adjacent source and detail panes
- **THEN** the panes share one full-bleed workflow and remain distinguishable without an outer frame,
  empty gutter, decorative separator, or a card around each row

#### Scenario: Analytics overview
- **WHEN** populated Analytics renders its six groups
- **THEN** each group has a consistent tonal surface, heading hierarchy, compact table density, and
  hover or focus feedback without an outline or nested row cards

#### Scenario: Calendar workflow
- **WHEN** Calendar contains birthdays or dated tag events
- **THEN** its controls, Tag rail, and cells read as one bounded workflow while every day cell
  remains individually actionable and legible

#### Scenario: Editor workspace
- **WHEN** the Editor renders an empty or populated current structure
- **THEN** the canvas retains its full interactive area and distinct neutral background while its
  toolbar groups, nodes, selection, and focus states use the shared visual language

### Requirement: Shared controls and feedback are consistent
Shared controls SHALL use consistent heights, corner radii, text hierarchy, icon sizing, focus
rings, and disabled treatment across buttons, fields, choices, empty states, dialogs, popovers,
status feedback, and destructive actions. Primary actions SHALL be visually stronger than
secondary and icon-only actions, and every state SHALL remain identifiable without motion. Buttons
SHALL NOT use a permanent decorative border. Pointer hover, active, and selected states SHALL NOT
introduce a decorative border, outline, inset hairline, elevation shadow, transform, or geometry
change. Ordinary in-flow controls, selected choices, cards, shell chrome, and toolbars SHALL NOT use
decorative resting shadows. Keyboard focus, destructive boundaries, editable fields, calendar
geometry, data previews, and canvas selection MAY retain purposeful boundaries. True dialog,
popover, tooltip, and drag overlay layers MAY use at most one restrained separation shadow.

#### Scenario: Primary and secondary actions
- **WHEN** a workflow presents a main action beside supporting actions
- **THEN** accent, fill, boundary, and text treatment communicate their relative priority while
  retaining their existing accessible names and behavior

#### Scenario: Pointer and keyboard interaction
- **WHEN** a user hovers, presses, or keyboard-focuses an enabled control
- **THEN** one dominant cue communicates the state through restrained tone, foreground contrast, or
  a keyboard-only focus ring without adding a pointer-state border, outline, shadow, transform, or
  size change
- **AND** pointer-down geometry matches resting geometry for buttons, tabs, checkboxes, and menu rows

#### Scenario: Empty state
- **WHEN** a product has no relevant organization data
- **THEN** one calm icon surface, concise hierarchy, and one focused next action explain the empty
  state without adding unavailable controls

#### Scenario: Status feedback
- **WHEN** an error or informational status appears
- **THEN** its semantic color, icon-independent text, spacing, and owned boundary distinguish it from
  both the header and workflow content

### Requirement: Text controls use leading thematic icons
Every text-bearing button and tab that includes a thematic action or destination icon SHALL render
that icon before its visible label in DOM and visual order, except the explicitly configured
Download Continue action whose directional arrow SHALL follow the label. Icon-only controls and
controls without an icon SHALL remain unchanged. A disclosure chevron, sort direction, removal
mark, status badge, or count MAY remain after the label when its trailing position communicates its
distinct affordance or state. Icon order SHALL NOT change the control's accessible name, geometry,
responsive behavior, or interaction states.

#### Scenario: Thematic button or tab icon
- **WHEN** a text-bearing button or tab includes a thematic action or destination icon
- **THEN** exactly that thematic icon appears before the visible label without duplicating its accessible name, unless the control is Download Continue

#### Scenario: Download Continue action
- **WHEN** the Download workflow exposes its Continue header action
- **THEN** its directional arrow appears after the visible label while retaining the same geometry and accessible name

#### Scenario: Trailing affordance
- **WHEN** a button includes a disclosure, sorting, removal, badge, or count affordance after its label
- **THEN** the affordance retains its trailing position and the control retains its existing accessible behavior

#### Scenario: Narrow icon-only action
- **WHEN** a responsive text action hides its label at a maintained narrow width
- **THEN** the same thematic icon remains centered with the unchanged accessible name and tooltip

### Requirement: Repeated content remains scan-friendly and performant
Repeated content SHALL use alignment, compact spacing, subtle row separation where useful, and
interaction feedback instead of floating row tiles across Employee lists, Analytics tables,
filters, tag pickers, and event lists. Existing virtualization, stable keys, content-driven
measurement, wrapped tag visibility, and bounded scrolling SHALL remain unchanged.

#### Scenario: Contiguous Employee list
- **WHEN** multiple Employees render in a virtualized list
- **THEN** rows remain contiguous and content-driven while a subtle separator and hover or focus
  state make row boundaries scannable

#### Scenario: Dense analytical rows
- **WHEN** an Analytics group contains more rows than its visible cap
- **THEN** the section retains its bounded scroll area, eight-row cap, sortable columns, and compact
  row treatment without rendering per-row cards

#### Scenario: Many Employee tags
- **WHEN** an Employee row contains tags that wrap across multiple lines
- **THEN** all tags remain visible, the virtualizer remeasures the content, and adjacent rows do not
  overlap

### Requirement: Dialogs and overlays preserve task context
Dialog and alert-dialog surfaces SHALL remain distinct through overlay, radius, focus management,
and at most one restrained shadow. Language and Theme SHALL use compact modal radio lists. Non-modal
Popover, Select, Tag/search, and Editor menus SHALL retain one neutral hairline and borderless items.
Overlay levels SHALL place canvas tools below sidebar tooltips, sidebar content below dialogs,
Popovers above their owning dialog, nested Select portals above Popovers, and runtime errors above
all ordinary interaction layers. Headers, scrollable bodies, and footers SHALL use consistent
spacing and restrained tonal separation when it keeps actions or context visible.

#### Scenario: Modal setting selector
- **WHEN** Language or Theme opens over any workflow
- **THEN** the modal traps focus, shows stable radio rows, and remains above sidebar and canvas UI

#### Scenario: State Import dialog
- **WHEN** a valid or invalid state file is selected at a 390 px viewport
- **THEN** its compact summary or owned error and actions remain readable without horizontal overflow

#### Scenario: Destructive alert
- **WHEN** a destructive confirmation opens
- **THEN** overlay, warning copy, destructive action, and cancellation remain explicit in both
  themes

#### Scenario: Dropdown separation
- **WHEN** any non-modal floating menu opens over a same-tone page in either theme
- **THEN** one stable neutral outline distinguishes the container without an item border, geometry
  shift, or additional elevation

#### Scenario: Select inside a Popover
- **WHEN** the exact Tag color type Select opens inside the color Popover
- **THEN** every option renders above the Popover and remains pointer and keyboard accessible

### Requirement: Global transfer actions use focused modal workflows
Import SHALL open one responsive modal with State and Employees tabs, thematic icons before labels,
stable control geometry, and no navigation or shell movement. It SHALL expose file selection,
representative preview, mapping, options, review, and Apply inside the modal. Global Export SHALL
continue to download the complete State directly without opening a modal.

#### Scenario: Open Import modal
- **WHEN** a sidebar Import action is activated in compact or expanded mode
- **THEN** focus moves into its modal and returns to the trigger on close

#### Scenario: Narrow transfer modal
- **WHEN** the viewport is 390 px wide
- **THEN** tabs, mapping controls, counts, policies, and footer actions remain contained and usable

#### Scenario: Large match review
- **WHEN** Employee Import contains thousands of existing matches
- **THEN** one bounded scroll area renders virtualized rows with visible per-row policy controls

### Requirement: Download source and selection panes remain geometrically stable
At 768 px and wider, Data Download SHALL render source and selected-Employee panes at equal width.
Their source tabs and selected summary SHALL share the first horizontal row, and their two searches
SHALL share the next horizontal row. Switching Units and Employees MUST NOT change panel geometry.
Below 768 px the panes SHALL stack and each occupy half of the available workflow height without
horizontal overflow.

#### Scenario: Switch desktop source
- **WHEN** a user switches between Units and Employees at a maintained desktop width
- **THEN** both panes remain 50 percent wide and both search controls keep the same vertical position

#### Scenario: Use Download on a narrow screen
- **WHEN** Download renders below 768 px
- **THEN** source and selection panes stack as equal-height regions and every control remains reachable

### Requirement: Units detail panes use one compact alignment
At 768 px and wider, the Units hierarchy and Employee roster SHALL each occupy exactly half of the
workflow width. Their Unit-name and Employee searches SHALL share the same first-row vertical
position, height, and padding. The complete roster count and conditional filtered match count SHALL
appear immediately below the right search on its logical content edge; selected Unit identity and
breadcrumb SHALL follow before one contiguous Employee list. Below 768 px, the panes SHALL stack as
equal-height regions without horizontal overflow. The hierarchy SHALL begin directly at the
workflow content boundary, and search, count, breadcrumbs, and Employee rows SHALL share one logical
content edge.

#### Scenario: Populated desktop Units workflow
- **WHEN** a Unit with Employees renders at desktop width
- **THEN** both panes are equal width and both searches share one horizontal baseline

#### Scenario: Narrow Units workflow
- **WHEN** Units renders below 768 px
- **THEN** the hierarchy and roster are equal-height stacked panes with reachable controls

#### Scenario: Populated Units workflow alignment
- **WHEN** a Unit with Employees is selected at a maintained desktop width
- **THEN** its roster count is directly below Employee search and above Unit identity and breadcrumbs

#### Scenario: Contiguous selected-Unit roster
- **WHEN** a selected Unit contains both direct and descendant Employees
- **THEN** all matching Employee cards appear in one contiguous list without direct or descendant section headings
- **AND** one summary below search reports the complete total and conditional filtered match count

### Requirement: Employee management actions share the application header
The Employees section SHALL register Employee model, Tags, and Add Employee actions in the shared
header with leading thematic icons. Narrow screens SHALL retain accessible icon-only actions and
tooltips without changing header height.

#### Scenario: Open Employee management
- **WHEN** a user activates Employee model or Tags
- **THEN** the corresponding localized modal opens without replacing the Employees workflow

### Requirement: Navigation prioritizes Employees
The sidebar SHALL order Employees before Units while preserving the existing order of Editor,
Analytics, Calendar, Data Download, and utility actions.

#### Scenario: Read the primary navigation
- **WHEN** the sidebar is expanded or compact
- **THEN** Employees is the first product section and Units is second with unchanged icon geometry

### Requirement: Tag color is expressed through restrained surface fill
Colored Tag chips and Tag-like controls SHALL use one low-chroma tonal fill and matching readable
foreground without decorative leading dots, added borders, shadows, or geometry changes. Neutral
Tags SHALL retain a neutral fill, and hover, focus, active, and selected feedback SHALL not erase the
configured Tag identity.

#### Scenario: Interact with a colored Tag surface
- **WHEN** a colored Tag surface is hovered, focused, activated, or selected in either theme
- **THEN** its configured fill remains recognizable and its text remains readable without a color dot
