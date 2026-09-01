## ADDED Requirements

### Requirement: Text controls use leading thematic icons
Every text-bearing button and tab that includes a thematic action or destination icon SHALL render
that icon before its visible label in DOM and visual order. Icon-only controls and controls without
an icon SHALL remain unchanged. A disclosure chevron, sort direction, removal mark, status badge,
or count MAY remain after the label when its trailing position communicates its distinct affordance
or state. Icon order SHALL NOT change the control's accessible name, geometry, responsive behavior,
or interaction states.

#### Scenario: Thematic button or tab icon
- **WHEN** a text-bearing button or tab includes a thematic action or destination icon
- **THEN** exactly that thematic icon appears before the visible label without duplicating its accessible name

#### Scenario: Trailing affordance
- **WHEN** a button includes a disclosure, sorting, removal, badge, or count affordance after its label
- **THEN** the affordance retains its trailing position and the control retains its existing accessible behavior

#### Scenario: Narrow icon-only action
- **WHEN** a responsive text action hides its label at a maintained narrow width
- **THEN** the same thematic icon remains centered with the unchanged accessible name and tooltip

## MODIFIED Requirements

### Requirement: Navigation states are explicit and responsive
Product destinations SHALL retain their accessible Radix tab behavior and order inside a vertical
sidebar. The sidebar SHALL initialize compact and SHALL own language, theme, Import, and Export
without a project or file persistence control. Server mode SHALL additionally show MCP immediately
after Export and before language and theme; Pages SHALL omit it completely. Expanded mode SHALL show
icons and visible labels; compact mode SHALL show only icons with localized accessible names and
tooltips. The active destination, hover, press, and keyboard focus SHALL remain tonal, borderless,
shadowless, and geometry-stable. The enabled MCP icon SHALL use semantic green without changing its
container geometry; its disabled icon SHALL use the standard sidebar foreground. The desktop
collapse control and every compact sidebar action SHALL keep the same 48 px width, 40 px height,
14 px horizontal padding, 20 px icon size, and icon axis. The shell SHALL render no decorative
product glyph, visible product title, Save control, Autosave control, or persistence status. Sidebar
collapse and all other durable navigation context SHALL be represented in the current state.
The 64 px context header SHALL reserve one right-aligned workflow action for populated or empty
Teams and Employees and for populated Download. The action SHALL keep its localized accessible name
and leading thematic icon at ordinary widths and SHALL become icon-only without overflow at narrow
widths. Workflows SHALL NOT repeat that action inside their content or empty state.

#### Scenario: Initial blank sidebar
- **WHEN** a new blank state renders at desktop width
- **THEN** the sidebar starts as a 64 px compact icon rail and that durable mode can round-trip with the state

#### Scenario: Expanded and compact sidebar
- **WHEN** a desktop user toggles the sidebar mode
- **THEN** the right edge moves continuously between 240 and 64 px, icons keep one coordinate, and current product data remains unchanged

#### Scenario: Server MCP action
- **WHEN** the SQLite runtime renders the sidebar
- **THEN** MCP appears after Export and before language and theme with the same geometry in compact and expanded modes and a green icon only while enabled

#### Scenario: Pages actions
- **WHEN** Pages renders the sidebar
- **THEN** it exposes Import, Export, language, and theme without MCP, project, file, Save, or Autosave controls

#### Scenario: Stable menu content
- **WHEN** theme, language, MCP, or another menu item is hovered, focused, selected, or pressed
- **THEN** its content position and geometry remain unchanged without a pointer-state border

#### Scenario: Responsive shell containment
- **WHEN** either runtime renders at 390, 1024, or 1280 px wide
- **THEN** global actions remain reachable, narrow layouts retain an icon rail, and the context action remains contained without consuming workflow width

#### Scenario: Workflow context actions
- **WHEN** Teams, Employees, or populated Download is active
- **THEN** the context header exposes exactly one localized primary action whose thematic icon precedes the visible label
- **AND** the workflow body and empty state contain no duplicate of that action

#### Scenario: Narrow workflow context action
- **WHEN** a header action renders at a narrow supported width
- **THEN** its visible label is hidden, its icon remains centered, and its accessible name and tooltip remain available

### Requirement: MCP management is a focused floating workflow
The MCP modal SHALL use the shared dialog hierarchy and provide compact consent, credentials, a
copyable agent setup prompt, and activity without exposing credentials behind the modal or shifting
sidebar geometry. Its title SHALL have a localized screen-reader description but no visible subtitle.
Long setup prompts and activity lists SHALL scroll within bounded regions while primary Enable,
Disable, Rotate, Copy, and Undo decisions remain explicit. Setup and Activity tabs and the primary
Enable or Disable action SHALL retain localized visible labels and place a thematic decorative icon
before each label without changing control geometry. The modal SHALL not duplicate enabled status
in a badge and SHALL not render a raw configuration section, Examples tab, or provider-notice
section.

#### Scenario: Compact consent modal
- **WHEN** disabled MCP management opens at a narrow viewport
- **THEN** the full-access warning, cancellation, and icon-bearing Enable action remain readable without page overflow

#### Scenario: Enabled management modal
- **WHEN** enabled MCP management opens in either theme
- **THEN** endpoint, masked credentials, selected client, copyable setup prompt, and activity remain visually separated with restrained boundaries and shadows

#### Scenario: Accessible compact header
- **WHEN** assistive technology opens MCP management
- **THEN** it receives the MCP title and localized hidden description without rendering a visible subtitle

#### Scenario: MCP control icon order
- **WHEN** Setup, Activity, Enable, or Disable renders in the MCP modal
- **THEN** one thematic icon precedes the localized text and does not add a duplicate accessible name

### Requirement: Units detail panes use one compact alignment
The Units hierarchy SHALL begin directly at the workflow content boundary without an empty spacer
below the shared header. Search, breadcrumbs, and Employee rows SHALL share one horizontal start
aligned to the Employee avatar column without introducing an outer border or shadow. The selected
Unit roster SHALL present direct and descendant Employees as one contiguous list without a section
heading or repeated section count.

#### Scenario: Populated Units workflow alignment
- **WHEN** a Unit with Employees is selected at a maintained desktop width
- **THEN** the hierarchy has no redundant header gap and search, breadcrumbs, and Employee avatars share the documented content edge

#### Scenario: Contiguous selected-Unit roster
- **WHEN** a selected Unit contains both direct and descendant Employees
- **THEN** all matching Employee cards appear in one contiguous list without direct or descendant section headings
- **AND** one summary below search reports the complete total and conditional filtered match count
