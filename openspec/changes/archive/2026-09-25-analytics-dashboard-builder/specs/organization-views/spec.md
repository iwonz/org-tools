## MODIFIED Requirements

### Requirement: The system View is the canonical Units structure
The system View SHALL use the localized Units destination label and SHALL be the sole structure used by Units, global Employee Team assignment, and Employee-array Team Import. It SHALL NOT be renamable or deletable. Editor edits to the system View and Units edits SHALL operate on the same document. Analytics widgets MAY select the system or any custom View independently.

#### Scenario: Edit system Units from Editor
- **WHEN** the active Editor View is the system View and a Unit changes
- **THEN** Units immediately displays the same change without synchronization or document copying

#### Scenario: Protect the system View
- **WHEN** the View toolbar displays the system View
- **THEN** rename and delete actions are disabled while create remains available

#### Scenario: Select a custom analytics source
- **WHEN** a widget selects a custom View
- **THEN** its Unit, assignment, position, and boss fields resolve from only that View

## ADDED Requirements

### Requirement: Saved analytics references protect Views
A custom View SHALL NOT be deleted while any saved analytics widget selects it. The refusal MUST identify the referencing dashboards and widgets and MUST leave the View and dashboard definitions unchanged.

#### Scenario: Delete a referenced View
- **WHEN** a user confirms deletion of a custom View selected by one or more widgets
- **THEN** deletion is blocked and each saved reference remains valid

