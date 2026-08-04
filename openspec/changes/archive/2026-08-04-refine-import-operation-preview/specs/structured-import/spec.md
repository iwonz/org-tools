## ADDED Requirements

### Requirement: Partial state operations are visually distinct
For Teams, Employees, and Teams + Employees, the application SHALL present Append and Replace all
current in a dedicated Import mode section separate from the state-content choices, SHALL select
Append by default, and SHALL give replacement an explicit destructive treatment.

#### Scenario: Choose a partial operation
- **WHEN** a user selects any partial projection
- **THEN** a responsive radio-card group presents Append and Replace all current with distinct selected and destructive states

#### Scenario: Full workspace operation
- **WHEN** Full workspace is selected
- **THEN** the operation radio-card group is absent and the dedicated replacement-only warning remains

### Requirement: Partial state preview shows normalized hierarchy and Employees
The application SHALL preview a selected partial projection as a virtualized ordered Team hierarchy
and normalized Employee cards before confirmation, without changing the detached candidate.

#### Scenario: Teams preview
- **WHEN** Teams is selected
- **THEN** every Team and nested Team appears in source order with hierarchy guides, mode, and direct-assignment count, and no Employee catalog is invented

#### Scenario: Employees preview
- **WHEN** Employees is selected
- **THEN** every imported Employee appears as a read-only card and no empty-Team placeholder is shown

#### Scenario: Teams and Employees preview
- **WHEN** Teams + Employees is selected
- **THEN** manual Employee cards appear inside their Teams with position and boss state, and Employees without a direct manual assignment appear in a separate section

#### Scenario: Live Team preview
- **WHEN** a Live Team references a Live boss or position overrides
- **THEN** those Employees appear as Live role cards while calculated Live membership is not presented as a direct assignment

#### Scenario: Append and Replace status
- **WHEN** the user switches between Append and Replace
- **THEN** Append distinguishes new and reused Employees while Replace shows a neutral imported total

#### Scenario: Large preview
- **WHEN** a valid import contains a large hierarchy and many assignments
- **THEN** stable flattened rows are virtualized and dynamically measured inside a bounded preview viewport
