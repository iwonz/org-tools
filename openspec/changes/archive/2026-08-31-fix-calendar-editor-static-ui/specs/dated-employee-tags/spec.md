## MODIFIED Requirements

### Requirement: Calendar day dialogs omit absent dated-tag content
The application SHALL render Birthday and Dated tags sections of a Calendar day dialog only when
the selected day has at least one corresponding event. Omitting either section SHALL NOT hide the
other section or reserve an empty column.

#### Scenario: Birthday-only day
- **WHEN** a user opens a Calendar day that has birthdays and no dated-tag events
- **THEN** the dialog shows the birthdays section across the available body width
- **AND** no dated-tag heading, empty message, or empty second column is rendered

#### Scenario: Dated-tag-only day
- **WHEN** a user opens a Calendar day that has dated-tag events and no birthdays
- **THEN** the dialog shows the dated-tag section across the available body width
- **AND** no Birthday heading, empty message, or empty first column is rendered

#### Scenario: Day with birthdays and dated tags
- **WHEN** a user opens a Calendar day that has birthdays and dated-tag events
- **THEN** the dialog shows both populated sections and every event for that day

## ADDED Requirements

### Requirement: Calendar tag dialogs omit absent event periods
The application SHALL render the Past section of a dated-tag dialog only when the selected tag has
at least one past event. Omitting Past SHALL give the Current and upcoming section the available
dialog body and SHALL NOT render an empty-state message for the absent period.

#### Scenario: Tag without past events
- **WHEN** a user opens a dated-tag dialog whose events are all current or future
- **THEN** Current and upcoming uses the available body
- **AND** no Past heading, no-past-events message, or empty second row is rendered

#### Scenario: Tag with past events
- **WHEN** a user opens a dated-tag dialog that contains at least one past event
- **THEN** the populated Past section appears separately in descending date order
