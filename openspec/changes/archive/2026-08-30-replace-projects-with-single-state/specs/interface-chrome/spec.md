## MODIFIED Requirements

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
without a project or file persistence control. Expanded mode SHALL show icons and visible labels;
compact mode SHALL show only icons with localized accessible names and tooltips. The active
destination, hover, press, and keyboard focus SHALL remain tonal, borderless, shadowless, and
geometry-stable. The desktop collapse control SHALL keep the same 48 px width, 40 px height, 14 px
horizontal padding, 20 px icon size, and icon axis as compact navigation. The shell SHALL render no
decorative product glyph, visible product title, Save control, Autosave control, or persistence
status. Sidebar collapse and all other durable navigation context SHALL be represented in the
current state.

#### Scenario: Initial blank sidebar
- **WHEN** a new blank state renders at desktop width
- **THEN** the sidebar starts as a 64 px compact icon rail and that durable mode can round-trip with
  the state

#### Scenario: Expanded and compact sidebar
- **WHEN** a desktop user toggles sidebar mode
- **THEN** the right edge moves continuously between 240 and 64 px, icons keep one coordinate, and
  current product data remains unchanged

#### Scenario: Runtime-independent actions
- **WHEN** either SQLite or Pages mode renders the sidebar
- **THEN** it exposes the same Import, Export, language, and theme controls without a project or file
  menu

#### Scenario: Stable menu content
- **WHEN** theme, language, or another menu item is hovered, focused, selected, or pressed
- **THEN** its content position and geometry remain unchanged without a pointer-state border

#### Scenario: Responsive shell containment
- **WHEN** either runtime renders at 390, 1024, or 1280 px wide
- **THEN** global actions remain reachable, narrow layouts retain an icon rail, and no persistence
  control or header action consumes workflow width

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
- **THEN** overlay, warning copy, destructive action, and cancellation remain explicit in both themes

#### Scenario: Dropdown separation
- **WHEN** any non-modal floating menu opens over a same-tone page in either theme
- **THEN** one stable neutral outline distinguishes the container without an item border, geometry
  shift, or additional elevation

## REMOVED Requirements

### Requirement: Autosave is explicit and consistent
**Reason**: All state changes now persist automatically and there is no opt-in Autosave mode.

**Migration**: Remove every Autosave control, preference, timer, test, and message.

### Requirement: Save feedback is transient and stable
**Reason**: The manual Save lifecycle and success status no longer exist.

**Migration**: Remove Save, dirty, saving, saved, and revision-conflict UI; retain only actionable
localized persistence errors.
