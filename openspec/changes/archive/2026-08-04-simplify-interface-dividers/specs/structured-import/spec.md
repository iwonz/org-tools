## MODIFIED Requirements

### Requirement: Partial state operations are visually distinct
For Teams, Employees, and Teams + Employees, the application SHALL present Append and Replace all
current in a dedicated Import mode section separate from the state-content choices through spacing,
heading hierarchy, and selectable cards without a horizontal rule, SHALL select Append by default,
and SHALL give replacement an explicit destructive treatment.

#### Scenario: Choose a partial operation
- **WHEN** a user selects any partial projection
- **THEN** a responsive radio-card group presents Append and Replace all current with distinct selected and destructive states and no section divider line

#### Scenario: Full workspace operation
- **WHEN** Full workspace is selected
- **THEN** the operation radio-card group is absent and the dedicated replacement-only warning remains
