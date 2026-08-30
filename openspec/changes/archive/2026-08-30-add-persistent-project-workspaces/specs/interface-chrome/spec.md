## MODIFIED Requirements

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
and SHALL also own project selection, language, theme, Import, and workspace Export. The content
header SHALL contain only current workflow context and explicit project Save status and action.
Expanded mode SHALL show an icon and visible label for each destination or action; compact mode SHALL
show only icons while preserving accessible names and hover tooltips. The active destination SHALL
use stronger foreground and a tonal surface, pointer hover SHALL use a low-opacity tonal wash,
pressed state SHALL remain visually responsive, and keyboard focus SHALL remain explicitly visible
without layout shift or a pointer-state border. Compact rows SHALL center their icons within the rail
with equal inline space. The desktop collapse control SHALL use the same 48 px width, 40 px height,
14 px horizontal padding, 20 px icon size, and fixed icon axis as a product navigation item in
compact mode, in both expanded and compact sidebar modes. It SHALL keep its icon distinguishable
from its background in every interaction state and SHALL NOT span the expanded sidebar width. The
shell SHALL NOT render a decorative Org Tools glyph or a visible Org Tools title. Project, theme,
and language menu items SHALL NOT translate or otherwise shift their content when highlighted,
focused, selected, or pressed. Collapsing or expanding SHALL animate only the sidebar's right edge
and clipped label visibility; navigation and action icons SHALL keep one horizontal coordinate, and
neither icons nor the toggle SHALL discretely jump between alignment modes.

#### Scenario: Initial desktop sidebar
- **WHEN** a project first renders at a desktop width
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

#### Scenario: Project switcher
- **WHEN** the project control renders in either sidebar mode or opens its menu
- **THEN** it uses the same icon axis, padding, tone, focus, and stable menu-row geometry as the
  surrounding sidebar while exposing project selection and management accessibly

#### Scenario: Explicit Save feedback
- **WHEN** organization data is clean, dirty, saving, saved, or failed
- **THEN** the header communicates the state without resizing the workflow title or adding a border,
  decorative shadow, or saturated accent

#### Scenario: Stable sidebar menus and collapse control
- **WHEN** the collapse control renders or receives pointer interaction in either sidebar mode
- **THEN** its width and horizontal padding equal those of a product navigation item in compact mode
- **AND** its icon remains visible on the same horizontal icon axis as product navigation without
  rendering an Org Tools title
- **AND** project, theme, and language menu-item content keeps the same position before, during, and
  after interaction

#### Scenario: Continuous sidebar collapse
- **WHEN** a desktop user collapses or expands the sidebar without reduced motion
- **THEN** the right edge moves monotonically between 240 and 64 px while row icons keep their
  horizontal coordinate and labels clip and fade within the changing width
- **AND** the collapse button width, horizontal padding, and icon coordinate stay unchanged
  throughout the transition

#### Scenario: Responsive shell containment
- **WHEN** the application renders at 390, 1024, or 1280 px wide
- **THEN** the sidebar, project control, Save action, and global actions remain reachable, narrow
  layouts preserve an icon-only rail, the content workspace keeps usable width, and the page has no
  horizontal overflow
