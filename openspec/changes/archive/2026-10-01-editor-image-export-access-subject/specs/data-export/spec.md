## ADDED Requirements

### Requirement: Editor PNG can use another account's authorized projection
Both full-View and scoped Unit Editor PNG dialogs SHALL let a Super Administrator choose an active
account whose authorized projection supplies Preview, Copy, and Save. The control MUST default to
the current account on every dialog open and MUST NOT persist or change the current session.

#### Scenario: Export as another account
- **WHEN** a Super Administrator selects an active account and its projection is ready
- **THEN** Preview, copied PNG, and saved PNG use the same selected account, View, revisions, visible data, and geometry

#### Scenario: Reopen image export
- **WHEN** a dialog is closed after selecting another account and later reopened
- **THEN** it starts with the current account's authorized source and unchanged local image defaults

#### Scenario: Selected subject cannot access the export root
- **WHEN** the selected account cannot read the current View or scoped root Unit
- **THEN** the dialog shows an unavailable message and disables Preview, Copy, and Save without falling back to administrator data

### Requirement: Alternate export retains actor image settings only
Alternate-subject PNG SHALL retain the acting account's transient background, padding, rounding,
scope, Employee format, and line-gap settings. Token suggestions and token values MUST come only
from the selected subject's visible field definitions and resolved values.

#### Scenario: Format references a hidden field
- **WHEN** the actor's local Employee format references a field hidden from the selected subject
- **THEN** that token resolves empty and neither its source value nor definition enters the alternate export payload
