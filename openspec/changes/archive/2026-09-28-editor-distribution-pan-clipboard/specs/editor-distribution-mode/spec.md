## MODIFIED Requirements

### Requirement: Units expose an independent distribution mode
The Editor SHALL allow distribution mode to be enabled independently for one or many selected Units
in the active View through one context-menu submenu. The submenu SHALL expose separate selected-only
and selected-with-descendants scopes, and each scope SHALL expose checked, unchecked, and accessible
mixed states. The descendant scope MUST include each selected Unit and its complete cycle-safe
descendant closure exactly once in active View order. Activating an all-enabled scope SHALL disable
every Unit in that scope; activating an unchecked or mixed scope SHALL enable every Unit in that
scope in one bounded UI update. Units outside the chosen scope MUST remain unchanged. The mode SHALL
remain View-local UI state and MUST NOT change the Unit document, timestamps, history, selection, or
geometry.

#### Scenario: Toggle selected Units only
- **WHEN** the user activates the selected-only scope for one or more context Units
- **THEN** only those Units change distribution state, the submenu closes, and no structural command is created

#### Scenario: Toggle selected branches
- **WHEN** selected Units contain overlapping ancestors and descendants and the user activates the descendant scope
- **THEN** their deduplicated complete closures change once in active View order while unrelated Units remain unchanged

#### Scenario: Enable a mixed scope
- **WHEN** the chosen scope contains enabled and disabled distribution modes and the user activates its mixed switch
- **THEN** every Unit in that scope becomes enabled through one UI update while selection remains unchanged

#### Scenario: Disable an enabled scope
- **WHEN** every Unit in the chosen scope has distribution mode enabled and the user activates its checked switch
- **THEN** every Unit in that scope becomes disabled through one UI update while selection remains unchanged

#### Scenario: Operate the scope submenu accessibly
- **WHEN** the user opens and navigates the distribution submenu with pointer, keyboard, or RTL layout
- **THEN** focus, hover, directional keys, Enter, Space, Escape, placement, and accessible checked states follow the maintained Editor submenu behavior

### Requirement: One selected Employee reveals placement connections
The Editor SHALL draw pointer-inert connections using the View distributedColor foreground only when selection contains exactly one
Employee occurrence whose source Unit has distribution mode enabled. Each path SHALL connect that
row to one other current placement without changing selection, layout, spatial indexes, or output.
A primary-button drag on blank canvas that exceeds the maintained pan threshold, middle-button pan,
wheel zoom, edge pan, or canceled pointer gesture MUST retain that selection and its connections. A
primary-button blank-canvas gesture that remains within the threshold SHALL clear selection as an
ordinary blank click.

#### Scenario: Connect expanded placements
- **WHEN** the selected Employee is visible in another expanded Unit
- **THEN** a deterministic curve connects the opposing edges of the exact source and target rows

#### Scenario: Connect a hidden collapsed placement
- **WHEN** the selected Employee belongs to a collapsed Unit where its row is hidden
- **THEN** the curve terminates at the nearest Unit edge with a compact endpoint marker

#### Scenario: Pan toward an off-screen placement
- **WHEN** one Employee is selected and the user performs a real blank-canvas pan toward an off-screen target
- **THEN** selection and every current placement connection remain visible through the completed viewport update

#### Scenario: Click blank canvas
- **WHEN** the primary-button blank-canvas gesture remains within the drag threshold
- **THEN** selection clears and its transient placement connections disappear

#### Scenario: Select multiple items
- **WHEN** selection contains two or more items
- **THEN** all distribution connections are hidden while enabled-Unit row highlighting remains
