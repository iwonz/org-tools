## ADDED Requirements

### Requirement: Calendar day dialogs omit absent dated-tag content
The application SHALL render the dated-tag section of a Calendar day dialog only when the selected
day has at least one dated-tag event. Omitting the section SHALL NOT hide birthdays or reserve an
empty dated-tag column.

#### Scenario: Birthday-only day
- **WHEN** a user opens a Calendar day that has birthdays and no dated-tag events
- **THEN** the dialog shows the birthdays section across the available body width
- **AND** no dated-tag heading, empty message, or empty second column is rendered

#### Scenario: Day with dated tags
- **WHEN** a user opens a Calendar day that has at least one dated-tag event
- **THEN** the dialog shows the dated-tag section and every event for that day
