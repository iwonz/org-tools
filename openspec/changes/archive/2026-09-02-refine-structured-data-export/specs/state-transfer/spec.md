## MODIFIED Requirements

### Requirement: Export selects complete State or flat Employees
The global Export action SHALL immediately validate and download the strict current state as
`org-tools-state.json`. It SHALL NOT open a mode dialog or offer a separate Employee export. State
and mapped Employee Import SHALL remain available as distinct Import tabs.

#### Scenario: Export complete State
- **WHEN** the user activates global Export
- **THEN** one current `{ organization, ui }` JSON document downloads immediately without changing runtime state or opening a dialog

#### Scenario: Export validation failure
- **WHEN** the live state cannot pass the production parser
- **THEN** no file downloads and the shell presents a localized owned error

#### Scenario: Import choices remain available
- **WHEN** the user opens Import
- **THEN** complete State and mapped Employees remain the only two Import tabs
