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
SHALL be represented in the current state.
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
- **THEN** tabs, representative preview, mapping controls, counts, policies, and footer actions remain contained and usable

#### Scenario: Large match review
- **WHEN** Employee Import contains thousands of existing matches
- **THEN** one bounded scroll area renders virtualized rows with visible per-row policy controls

## ADDED Requirements

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
