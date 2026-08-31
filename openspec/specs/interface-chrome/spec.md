# interface-chrome Specification

## Purpose
Define the restrained layered shell, interaction states, workflow grouping, and overlay hierarchy.
## Requirements
### Requirement: Application chrome uses a restrained layered visual system
The application SHALL use a dark collapsible navigation sidebar, a compact workflow content header
without persistence actions or status, a low-contrast shell, full-bleed primary workflows without
decorative outer frames or empty perimeter gutters, and restrained tonal inner grouping in both
light and dark themes. Primary actions SHALL use an accessible graphite treatment; focus, active
navigation, and selection SHALL use neutral tonal cues while destructive and event colors remain
semantic. Surface, typography, spacing, radius, shadow, and control-height decisions SHALL be
consistent across all six product workflows without adding a remote asset, request, or runtime
dependency.

The shared interaction signal SHALL use a restrained steel-blue hue, while larger active, selected,
and hover surfaces SHALL remain nearly neutral blue-gray rather than violet or lavender. The signal
SHALL NOT replace graphite primary actions or semantic destructive and calendar-event colors.

The application SHALL use Inter as its sole UI typeface across headings, body text, placeholders,
native form controls, portals, and code-like editing surfaces. A font chosen for an image-export
artifact MAY appear inside that artifact or its explicit preview but SHALL NOT change the
surrounding application chrome.

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

#### Scenario: Uniform UI typography
- **WHEN** the browser renders ordinary text, a heading, placeholder, native control, dialog portal,
  menu, or template editing surface
- **THEN** its computed UI font family starts with Inter regardless of workflow or locale

#### Scenario: Utilitarian interaction palette
- **WHEN** the application renders focus, selection, active, or hover feedback in either theme
- **THEN** small signal details use restrained steel-blue and larger tonal surfaces use low-chroma
  blue-gray without a violet or lavender cast

### Requirement: Navigation states are explicit and responsive
Product destinations SHALL retain their accessible Radix tab behavior and order inside a vertical
sidebar. The sidebar SHALL initialize compact and SHALL own language, theme, Import, and Export
without a project or file persistence control. Server mode SHALL additionally show MCP immediately
after Export and before language and theme; Pages SHALL omit it completely. Expanded mode SHALL show
icons and visible labels; compact mode SHALL show only icons with localized accessible names and
tooltips. The active destination, hover, press, and keyboard focus SHALL remain tonal, borderless,
shadowless, and geometry-stable. The desktop collapse control and every compact sidebar action SHALL
keep the same 48 px width, 40 px height, 14 px horizontal padding, 20 px icon size, and icon axis.
The shell SHALL render no decorative product glyph, visible product title, Save control, Autosave
control, or persistence status. Sidebar collapse and all other durable navigation context SHALL be
represented in the current state.

#### Scenario: Initial blank sidebar
- **WHEN** a new blank state renders at desktop width
- **THEN** the sidebar starts as a 64 px compact icon rail and that durable mode can round-trip with the state

#### Scenario: Expanded and compact sidebar
- **WHEN** a desktop user toggles the sidebar mode
- **THEN** the right edge moves continuously between 240 and 64 px, icons keep one coordinate, and current product data remains unchanged

#### Scenario: Server MCP action
- **WHEN** the SQLite runtime renders the sidebar
- **THEN** MCP appears after Export and before language and theme with the same geometry in compact and expanded modes

#### Scenario: Pages actions
- **WHEN** Pages renders the sidebar
- **THEN** it exposes Import, Export, language, and theme without MCP, project, file, Save, or Autosave controls

#### Scenario: Stable menu content
- **WHEN** theme, language, MCP, or another menu item is hovered, focused, selected, or pressed
- **THEN** its content position and geometry remain unchanged without a pointer-state border

#### Scenario: Responsive shell containment
- **WHEN** either runtime renders at 390, 1024, or 1280 px wide
- **THEN** global actions remain reachable, narrow layouts retain an icon rail, and no persistence control or header action consumes workflow width

### Requirement: Product workflows use purposeful grouping
Teams, Employees, Analytics, Calendar, and Download SHALL render their primary task content
full-bleed without an outer panel border, radius, shadow, or shell-colored gap. Teams and Download
SHALL distinguish source and detail panes through tone, typography, and compact layout without a
decorative separator. Analytics SHALL group each metric table in one uniform soft tonal section
whose heading, column header, and row viewport do not stack competing neutral backgrounds or
outlines. Calendar SHALL group its header, event cloud, and month grid through spacing and tone while
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
- **THEN** its controls, event cloud, and cells read as one bounded workflow while every day cell
  remains individually actionable and legible

#### Scenario: Editor workspace
- **WHEN** the Editor renders an empty or populated View
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
Dialog and alert-dialog outer surfaces SHALL remain distinct from the shell through radius and
overlay, with at most one restrained separation shadow and no decorative outline. Headers,
scrollable bodies, and footers SHALL use consistent spacing and restrained tonal separation when it
keeps actions or context visible. Every non-modal Popover, Select, theme/language menu, tag/search
menu, and Editor context menu SHALL use one permanent neutral container hairline and at most one
restrained shadow; its items and pointer states SHALL remain borderless. Floating surfaces SHALL
retain localized copy, accessible names, close behavior, and focus management.

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

### Requirement: MCP management is a focused floating workflow
The MCP modal SHALL use the shared dialog hierarchy and provide compact status and consent,
credentials, setup, examples, and activity sections without exposing credentials behind the modal
or shifting sidebar geometry. Long client snippets and activity lists SHALL scroll within bounded
regions while primary Enable, Disable, Rotate, and Undo decisions remain explicit.

#### Scenario: Compact consent modal
- **WHEN** disabled MCP management opens at a narrow viewport
- **THEN** the full-access warning, privacy boundary, cancellation, and Enable action remain readable without page overflow

#### Scenario: Enabled management modal
- **WHEN** enabled MCP management opens in either theme
- **THEN** endpoint, masked credentials, setup navigation, examples, and activity remain visually separated with restrained boundaries and shadows
