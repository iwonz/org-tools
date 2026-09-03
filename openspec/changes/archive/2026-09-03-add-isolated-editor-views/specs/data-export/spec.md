## ADDED Requirements

### Requirement: Data Download selects an isolated View source
Data Download SHALL expose an independent View Select containing the system and every custom View.
Its Unit tree, assignments, positions, and available Employees SHALL come only from the selected
View, and the Employee source list SHALL contain only Employees assigned anywhere in that View.
Editor export SHALL use the active Editor View.

#### Scenario: Select a custom Download source
- **WHEN** the user selects a custom View in Data Download
- **THEN** Unit and Employee selection reflects only that View while global Employee fields and Tags remain current

#### Scenario: Change Download source
- **WHEN** a different source View is selected
- **THEN** source selections, Employee exclusions, Unit exclusions, and source-specific filters reset while output field, Template, and global Tag-exclusion settings remain

#### Scenario: Delete the Download source
- **WHEN** the selected custom View is deleted
- **THEN** Download falls back to the system View and performs the same source reset atomically

#### Scenario: Export the active Editor View
- **WHEN** Image, JSON, or Template export starts from an Editor Unit
- **THEN** its scope and assignments come only from the active View
