## ADDED Requirements

### Requirement: Employee tag assignments can carry one optional date
The application SHALL represent every Employee tag as a normalized label and a nullable real calendar date in `YYYY-MM-DD` form, SHALL identify labels case-insensitively without using the date, and SHALL reject conflicting duplicate assignments.

#### Scenario: Valid dated tag
- **WHEN** an Employee is assigned the label `Last day` with `2030-04-30`
- **THEN** the normalized Employee retains one tag record with that label and date

#### Scenario: Invalid or conflicting date
- **WHEN** a tag contains an impossible ISO date or two case-insensitive copies of a label contain different dates
- **THEN** the affected strict operation is rejected without changing organization state

### Requirement: Tag dates are editable in single and bulk workflows
The application SHALL let users set, replace, clear, or remove dates in the Employee form and quick tag editor, and SHALL support preserving, mixing, setting, clearing, and removing dates across bulk Employee selections.

#### Scenario: Add an existing tag in bulk
- **WHEN** a bulk tag toggle adds a label to missing Employees
- **THEN** missing Employees receive the label with a null date and existing Employees retain their current dates

#### Scenario: Apply a bulk date
- **WHEN** selected Employees show mixed dates for one assigned label and the user sets or clears a common date
- **THEN** the same requested date value is applied to every selected Employee carrying that label

### Requirement: Dated tags are visible without changing label semantics
The application SHALL show a compact localized date and full-date tooltip on dated tag chips while sorting, searching, option identity, and Live filtering continue to use only the label.

#### Scenario: Search a dated tag
- **WHEN** an Employee has a dated tag and the user searches or filters by its label
- **THEN** the Employee matches exactly as an undated assignment of the same label would
