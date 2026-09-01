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
The application SHALL hide optional date controls by default, expose a calendar action beside each
assigned tag, and let the resulting compact popover set, replace, or clear a date in single and bulk
Employee workflows while tag removal remains distinct. The popover SHALL use the local UI-kit
calendar instead of a native date input and SHALL NOT repeat the tag label inside the popover.

#### Scenario: Open date editor
- **WHEN** a user activates the calendar action for an assigned tag
- **THEN** a localized single-date calendar and Clear date action appear
- **AND** no native date input or repeated tag label is rendered

#### Scenario: Add an existing tag in bulk
- **WHEN** a bulk tag toggle adds a label to missing Employees
- **THEN** missing Employees receive the label with a null date and existing Employees retain their current dates

#### Scenario: Apply a bulk date
- **WHEN** selected Employees show mixed dates for one label and the user selects or clears a common date
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

### Requirement: Calendar day dialogs omit absent dated-tag content
The application SHALL render Birthday and dated-event content of a Calendar day dialog only when
the selected day has at least one corresponding event. The dated-event content SHALL omit a visible
Dated tags heading and SHALL render one complete shared Employee card per Employee with ordinary
right-aligned Tag, Edit, and Delete actions. Multiple events for one Employee on the selected day
MUST remain visible as separate navigable labels inside that Employee's card. Omitting either content
group SHALL NOT hide the other group or reserve an empty column.

#### Scenario: Birthday-only day
- **WHEN** a user opens a Calendar day that has birthdays and no dated-tag events
- **THEN** the dialog shows the birthdays section across the available body width
- **AND** no dated-tag heading, empty message, or empty second column is rendered

#### Scenario: Dated-tag-only day
- **WHEN** a user opens a Calendar day that has dated-tag events and no birthdays
- **THEN** the dialog shows full Employee cards with right-aligned Tag, Edit, and Delete actions across the available body width
- **AND** no Dated tags or Birthday heading, empty message, or empty first column is rendered

#### Scenario: Day with birthdays and dated tags
- **WHEN** a user opens a Calendar day that has birthdays and dated-tag events
- **THEN** the dialog shows both populated content groups and every event label for that day
- **AND** the dated-event group has no visible Dated tags heading

#### Scenario: Multiple labels for one Employee
- **WHEN** one Employee has multiple dated tags on the selected day
- **THEN** one Employee card contains every corresponding label
- **AND** activating any label opens that label's dated-tag history

### Requirement: Calendar tag dialogs omit absent event periods
The application SHALL render the Past section of a dated-tag dialog only when the selected tag has
at least one past event. The current and upcoming event group SHALL use the available dialog body
without rendering a visible Current and upcoming heading. Omitting Past SHALL NOT render an
empty-state message for the absent period.

#### Scenario: Tag without past events
- **WHEN** a user opens a dated-tag dialog whose events are all current or future
- **THEN** current and upcoming Employee cards use the available body without a period heading
- **AND** no Past heading, no-past-events message, or empty second row is rendered

#### Scenario: Tag with past events
- **WHEN** a user opens a dated-tag dialog that contains at least one past event
- **THEN** current and upcoming Employee cards appear without a heading
- **AND** the populated Past section appears separately in descending date order

#### Scenario: Tag with only past events
- **WHEN** a dated-tag dialog has no current or future event and has at least one past event
- **THEN** the current-period message remains content-sized without reserving half the dialog
- **AND** the populated Past section receives the remaining body height

### Requirement: Quick Employee tag options remain compact
The quick Employee tag picker SHALL use compact virtualized rows that fit the checkbox, tag label,
and optional date action without clipping or oversized vertical whitespace.

#### Scenario: Tag option density
- **WHEN** the quick tag picker contains multiple labels
- **THEN** each option occupies at most 44 px and its checkbox, label, and date action remain centered,
  visible, and independently actionable
