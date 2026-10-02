## MODIFIED Requirements

### Requirement: Legacy State and Employee transfer surfaces are absent
The shell, routes, parsers, fixtures, messages, tests, and current documentation SHALL NOT expose
complete State Import/Export or mapped Employee Import. Complete application recovery SHALL use
encrypted authorized Backup/Restore, while Data Download and Editor exports SHALL remain separate
permission-filtered outputs that never imply a complete recoverable state.

#### Scenario: Inspect global transfer actions
- **WHEN** an authenticated user opens the shell and Administration surfaces
- **THEN** only actions allowed by current Backup, Restore, Data Download, and Editor export permissions are available and no legacy transfer action appears

#### Scenario: Submit a legacy State file
- **WHEN** a caller uploads legacy State JSON to any supported route
- **THEN** it is rejected without parsing it as Backup or changing organization data
