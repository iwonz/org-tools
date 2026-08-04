# dated-employee-tags Specification

## Purpose
Define optional Employee tag dates, date editing behavior, and label-only tag semantics.
## Requirements
### Requirement: Employee tag assignments can carry one optional date
The application SHALL represent every Employee tag as a normalized label and a nullable real calendar date in `YYYY-MM-DD` form, SHALL identify labels case-insensitively without using the date, and SHALL reject conflicting duplicate assignments.

#### Scenario: Valid dated tag
- **WHEN** an Employee is assigned the label `Last day` with `2030-04-30`
- **THEN** the normalized Employee retains one tag record with that label and date

#### Scenario: Invalid or conflicting date
- **WHEN** a tag contains an impossible ISO date or two case-insensitive copies of a label contain different dates
- **THEN** the affected strict operation is rejected without changing organization state

### Requirement: Tag dates are editable in single and bulk workflows
The application SHALL hide optional date inputs by default, expose a calendar action beside each
assigned tag, and let the resulting compact popover set, replace, or clear a date in single and bulk
Employee workflows while tag removal remains distinct.

#### Scenario: Open date editor
- **WHEN** a user activates the calendar action for an assigned tag
- **THEN** a localized date control and Clear action appear without exposing date inputs for other tags

#### Scenario: Add an existing tag in bulk
- **WHEN** a bulk tag toggle adds a label to missing Employees
- **THEN** missing Employees receive the label with a null date and existing Employees retain their current dates

#### Scenario: Apply a bulk date
- **WHEN** selected Employees show mixed dates for one label and the user sets or clears a common date
- **THEN** the same requested date value is applied to every selected Employee carrying the label

### Requirement: Dated tags are visible without changing label semantics
The application SHALL display every assigned tag without caps or overflow counters, wrap chips onto
additional rows, render dated labels as `label · localized date` with a full-date tooltip, and keep
sorting, searching, identity, and Live filtering based only on the label.

#### Scenario: Wrap all tags
- **WHEN** an Employee has more tags than fit on one row in a card, list, dialog, or the Org Editor
- **THEN** every tag remains visible on subsequent rows without a `+N` indicator

#### Scenario: Mixed bulk dates
- **WHEN** selected Employees carry one label with different dates
- **THEN** the bulk chip shows a localized `label · Mixed dates` value and permits a shared set or clear action

#### Scenario: Search a dated tag
- **WHEN** an Employee has a dated tag and the user searches or filters by its label
- **THEN** the Employee matches exactly as an undated assignment of the same label would
