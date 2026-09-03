## ADDED Requirements

### Requirement: Analytics remains bound to the system View
Analytics SHALL derive Unit-scoped membership and position context exclusively from the system View
and SHALL NOT expose a View selector. Custom View selection or mutation SHALL NOT change Analytics
until a global Employee field changes.

#### Scenario: Open Analytics after selecting a custom View
- **WHEN** the Editor has a custom View active
- **THEN** Analytics continues to show the canonical system organization

#### Scenario: Rearrange only a custom View
- **WHEN** custom Units or memberships change without a global Employee mutation
- **THEN** the system Analytics cache and results remain unchanged
