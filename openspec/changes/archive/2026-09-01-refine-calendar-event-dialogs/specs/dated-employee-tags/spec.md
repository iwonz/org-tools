## MODIFIED Requirements

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
