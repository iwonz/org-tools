## ADDED Requirements

### Requirement: Global Employee identity spans every View
Employee creation and core-field, custom-value, and Tag edits SHALL mutate one global Employee
catalog. Stable Employee UUID references SHALL be shared by every View and durable UI selection.
Identity field edits SHALL NOT change those UUIDs. Global deletion SHALL purge every View, while
Editor membership removal SHALL affect only the active View.

#### Scenario: Edit an Employee used by multiple Views
- **WHEN** an identity field changes for an Employee referenced by multiple Views
- **THEN** every View resolves the updated global profile through the same stable Employee UUID

#### Scenario: Edit View-local assignment fields
- **WHEN** the Editor form changes an Employee's Unit, position, or boss assignment in a custom View
- **THEN** global profile data is shared but those assignment changes remain inside the active View

#### Scenario: Edit Teams globally
- **WHEN** the Employee catalog form changes Teams
- **THEN** only assignments in the system View change
