## ADDED Requirements

### Requirement: Refined core workflows are completely localized
Both bundled locales SHALL provide matching non-empty visible and accessibility copy for database
recreation and confirmation, Template token descriptions and suggestions, representative Employee
Import preview metadata, source-to-target mapping, Calendar event groups, segmented Gender,
compound Birthday, draft Tag selection, and generic Unit form validation. Stable server recovery
codes MUST resolve through the catalog and raw filesystem or parser messages MUST NOT be rendered.

#### Scenario: Recover in Russian
- **WHEN** the Russian runtime shows either blocking database error and opens Create new confirmation
- **THEN** every warning, action, accessible name, and failure message is Russian without exposing a filesystem error

#### Scenario: Use refined workflows in English
- **WHEN** the English runtime opens token suggestions, Employee Import, a populated Calendar day, and the Employee form
- **THEN** all owned labels, descriptions, options, errors, and accessibility names are English

#### Scenario: Preserve machine and user values
- **WHEN** either locale displays `{token}`, a JSON source path, filename, Tag, Unit, or Employee data
- **THEN** the machine token and user-authored value remain verbatim while surrounding product copy is localized
