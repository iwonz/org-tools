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
collapse and all other durable navigation context SHALL be represented in the current state. The
64 px context header SHALL reserve one right-aligned workflow action for populated or empty Teams
and Employees and for populated Download. The action SHALL keep its localized accessible name and
right-side thematic icon at ordinary widths and SHALL become icon-only without overflow at narrow
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
- **THEN** the context header exposes exactly one localized primary action with its thematic icon after the visible label
- **AND** the workflow body and empty state contain no duplicate of that action

#### Scenario: Narrow workflow context action
- **WHEN** a header action renders at a narrow supported width
- **THEN** its visible label is hidden, its icon remains centered, and its accessible name and tooltip remain available
