# interface-chrome Specification

## Purpose
Define the restrained layered shell, interaction states, workflow grouping, and overlay hierarchy.

## Requirements

### Requirement: Application chrome uses a restrained layered visual system
The application SHALL use a dark collapsible navigation sidebar, a compact workflow content header
with explicit Save state, a low-contrast shell, full-bleed primary workflows without decorative
outer frames or empty perimeter gutters, and restrained tonal inner grouping in both light and dark
themes. Primary actions SHALL use an accessible graphite treatment; focus, active navigation, and
selection SHALL use neutral tonal cues while destructive and event colors remain semantic. Surface,
typography, spacing, radius, shadow, and control-height decisions SHALL be consistent across all six
product workflows and project management without adding a remote asset, request, or runtime
dependency.

The shared interaction signal SHALL use a restrained steel-blue hue, while larger active, selected,
and hover surfaces SHALL remain nearly neutral blue-gray rather than violet or lavender. The signal
SHALL NOT replace graphite primary actions or semantic destructive and calendar-event colors.

The application SHALL use Inter as its sole UI typeface across headings, body text, placeholders,
native form controls, browser file controls, portals, and code-like editing surfaces. A font chosen
for an image-export artifact MAY appear inside that artifact or its explicit preview but SHALL NOT
change the surrounding application chrome.

#### Scenario: Light hierarchy
- **WHEN** a product workflow renders in the light theme
- **THEN** the header, Save state, full-bleed workflow, internal groups, and semantic controls are
  distinguishable through a restrained combination of tone, typography, alignment, and spacing
- **AND** the workflow does not render every repeated row as a floating card

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
  project menu, or template editing surface
- **THEN** its computed UI font family starts with Inter regardless of workflow or locale

#### Scenario: Utilitarian interaction palette
- **WHEN** the application renders focus, selection, active, dirty, saving, saved, or hover feedback
  in either theme
- **THEN** small signal details use restrained steel-blue and larger tonal surfaces use low-chroma
  blue-gray without a violet or lavender cast
- **AND** primary actions remain graphite while destructive and event colors remain semantic

### Requirement: Navigation states are explicit and responsive
Product destinations SHALL retain their accessible Radix tab behavior and order inside a vertical
sidebar. The sidebar SHALL initialize in compact mode, SHALL remain transient rather than persisted,
and SHALL also own persistence selection, language, theme, Import, and workspace Export. SQLite mode
SHALL render the project switcher; browser mode SHALL render an equivalent single-file workspace
control. The content header SHALL contain only current workflow context, transient Save feedback,
and the Save action. Expanded mode SHALL show an icon and visible label for each destination or
action; compact mode SHALL show only icons while preserving accessible names and hover tooltips. The
active destination SHALL use stronger foreground and a tonal surface, pointer hover SHALL use a
low-opacity tonal wash, pressed state SHALL remain visually responsive, and keyboard
focus SHALL remain explicitly visible without layout shift or a pointer-state border. Compact rows
SHALL center their icons within the rail with equal inline space. The desktop collapse control SHALL
use the same 48 px width, 40 px height, 14 px horizontal padding, 20 px icon size, and fixed icon axis
as a product navigation item in compact mode, in both expanded and compact sidebar modes. It SHALL
keep its icon distinguishable from its background in every interaction state and SHALL NOT span the
expanded sidebar width. The shell SHALL NOT render a decorative Org Tools glyph or a visible Org
Tools title. Persistence, theme, and language menu items SHALL NOT translate or otherwise shift
their content when highlighted, focused, selected, or pressed. Collapsing or expanding SHALL animate
only the sidebar's right edge and clipped label visibility; navigation and action icons SHALL keep
one horizontal coordinate, and neither icons nor the toggle SHALL discretely jump between alignment
modes.

#### Scenario: Initial desktop sidebar
- **WHEN** either runtime first renders at a desktop width
- **THEN** the sidebar is a 64 px compact icon rail
- **AND** the transient sidebar mode has not been written to project data or browser storage

#### Scenario: Active product tab
- **WHEN** one of the six product tabs is active in either theme
- **THEN** its stronger foreground and tonal surface distinguish it from inactive destinations
  without a border, inset hairline, saturated button treatment, or reliance on font weight alone

#### Scenario: Nested navigation
- **WHEN** a nested tab group renders in Download, a dialog, or another workflow
- **THEN** it uses the same borderless tonal active, hover, disabled, and keyboard-focus language at
  the appropriate compact size

#### Scenario: Expanded and compact sidebar
- **WHEN** a desktop user toggles the sidebar mode
- **THEN** the shell switches between a labelled navigation panel and an icon-only rail without
  changing the current product workflow or organization data
- **AND** compact icons expose localized accessible names and pointer tooltips
- **AND** every compact icon is visually centered with equal left and right row space

#### Scenario: SQLite persistence control
- **WHEN** the local server runtime renders the sidebar persistence item
- **THEN** project selection, management, and the shared Autosave checkbox remain available with the
  same icon axis, padding, tone, focus, and stable menu-row geometry as the surrounding sidebar

#### Scenario: Browser persistence control
- **WHEN** the static Pages runtime renders the sidebar persistence item
- **THEN** filename, New, Open, and Save As use the same geometry and accessible behavior without a
  visible file-menu title, while Autosave appears only when File System Access is supported

#### Scenario: Explicit Save feedback
- **WHEN** organization data changes, saves, succeeds, or fails
- **THEN** the header communicates the transient state in a live region anchored beside Save without
  resizing the workflow title or moving the action

#### Scenario: Stable sidebar menus and collapse control
- **WHEN** the collapse control renders or receives pointer interaction in either sidebar mode
- **THEN** its width and horizontal padding equal those of a product navigation item in compact mode
- **AND** its icon remains visible on the same horizontal icon axis as product navigation without
  rendering an Org Tools title
- **AND** persistence, theme, and language menu-item content keeps the same position before, during,
  and after interaction

#### Scenario: Continuous sidebar collapse
- **WHEN** a desktop user collapses or expands the sidebar without reduced motion
- **THEN** the right edge moves monotonically between 240 and 64 px while row icons keep their
  horizontal coordinate and labels clip and fade within the changing width
- **AND** the collapse button width, horizontal padding, and icon coordinate stay unchanged
  throughout the transition

#### Scenario: Responsive shell containment
- **WHEN** either runtime renders at 390, 1024, or 1280 px wide
- **THEN** the sidebar persistence control, Save action, and global actions remain reachable, narrow
  layouts preserve an icon-only rail, the content workspace keeps usable width, and the page has no
  horizontal overflow

### Requirement: Autosave is explicit and consistent
The SQLite project popover and supported browser file popover SHALL expose the same accessible
Autosave checkbox, SHALL default it to off, and SHALL keep manual Save available regardless of the
choice. An unsupported browser SHALL render neither the checkbox nor explanatory File System Access
copy.

#### Scenario: Toggle Autosave
- **WHEN** the user changes an available checkbox
- **THEN** only the bounded preference changes immediately and the control does not shift or resize

#### Scenario: Autosave unavailable
- **WHEN** File System Access is unavailable in the browser runtime
- **THEN** no disabled Autosave row or support label appears

### Requirement: Save feedback is transient and stable
The shell SHALL render no status on initial clean load, SHALL show Unsaved for 2000 ms after an
organization mutation, SHALL show Saving for the complete write, SHALL show Saved for 2000 ms only
after a successful write, and SHALL keep Save failed visible until another mutation or save attempt.
The status SHALL be announced politely and SHALL NOT move the right-anchored Save action.

#### Scenario: Successful Save sequence
- **WHEN** dirty organization data saves successfully
- **THEN** Unsaved yields to Saving, Saved remains visible for 2000 ms, and the status then disappears

#### Scenario: Save failure sequence
- **WHEN** a Save fails
- **THEN** the failure remains visible while dirty state and the enabled Save action are preserved
  until another mutation or attempt replaces it

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

#### Scenario: Workspace Import dialog
- **WHEN** a valid or invalid workspace file is selected at a 390 px viewport
- **THEN** its compact summary or owned error and actions remain readable without horizontal overflow

#### Scenario: Destructive alert
- **WHEN** a destructive confirmation opens
- **THEN** overlay, warning copy, destructive action, and cancellation remain explicit in both
  themes

#### Scenario: Dropdown separation
- **WHEN** any non-modal floating menu opens over a same-tone page in either theme
- **THEN** one stable neutral outline distinguishes the container without adding an item border,
  hover border, geometry shift, or additional elevation
