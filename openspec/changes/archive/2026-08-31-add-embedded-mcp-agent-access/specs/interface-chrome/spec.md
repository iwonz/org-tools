## MODIFIED Requirements

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

## ADDED Requirements

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
