## MODIFIED Requirements

### Requirement: Navigation states are explicit and responsive
Product destinations SHALL retain their accessible Radix tab behavior and order inside a vertical
sidebar. The sidebar SHALL initialize compact and SHALL own language, theme, Import, and Export
without a project, file, agent-access, or persistence control in either runtime. Expanded mode SHALL
show icons and visible labels; compact mode SHALL show only icons with localized accessible names
and tooltips. The active destination, hover, press, and keyboard focus SHALL remain tonal,
borderless, shadowless, and geometry-stable. The desktop collapse control and every compact sidebar
action SHALL keep the same 48 px width, 40 px height, 14 px horizontal padding, 20 px icon size, and
icon axis. The shell SHALL render no decorative product glyph, visible product title, Save control,
Autosave control, or persistence status. Sidebar collapse and all other durable navigation context
SHALL be represented in the current state. The 64 px context header SHALL reserve one right-aligned
workflow action for populated or empty Teams and Employees and for populated Download. The action
SHALL keep its localized accessible name and leading thematic icon at ordinary widths and SHALL
become icon-only without overflow at narrow widths. Workflows SHALL NOT repeat that action inside
their content or empty state.

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

## REMOVED Requirements

### Requirement: MCP modal controls use leading decorative icons
**Reason**: The MCP modal and all client-specific controls are removed.
**Migration**: No replacement control is rendered in either runtime.

### Requirement: MCP management is a focused floating workflow
**Reason**: Agent access, credentials, setup, and activity are no longer product workflows.
**Migration**: Use the remaining standard dialogs for application-owned tasks.
