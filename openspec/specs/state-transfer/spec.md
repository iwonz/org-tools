# state-transfer Specification

## Purpose
Define strict complete-state and mapped-Employee Import/Export.
## Requirements
### Requirement: Legacy State and Employee transfer surfaces are absent
The shell, routes, parsers, fixtures, messages, tests, and documentation SHALL NOT expose complete
State Import/Export or mapped Employee Import. Complete recovery SHALL use encrypted Backup/Restore,
while Data Download and Editor export SHALL remain permission-filtered product outputs.

#### Scenario: Inspect global transfer actions
- **WHEN** an authenticated user opens the shell
- **THEN** no State Import, State Export, Employee Import, mapping, duplicate-review, or related action is available

#### Scenario: Submit a legacy State file
- **WHEN** a caller uploads legacy State JSON to any supported route
- **THEN** it is rejected without parsing it as Backup or changing organization data
