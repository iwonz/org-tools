## MODIFIED Requirements

### Requirement: Calendar exposes dated tag events and details
The Calendar SHALL show exact-date tag events separately from birthday avatars, limit a day cell to
two inline tag events plus an overflow count, and open a localized day dialog containing only
populated Birthday and dated-event content. Dated-event details SHALL omit a redundant section
heading and SHALL use complete shared Employee cards with right-aligned Tag, Edit, and Delete
actions while keeping every event label available for tag-history navigation.

#### Scenario: Open a populated day
- **WHEN** a user activates a day containing birthdays and dated tags
- **THEN** the dialog lists both populated content groups with their Employees and labels
- **AND** dated events use complete actionable Employee cards without a Dated tags heading

#### Scenario: Open tag history from a day
- **WHEN** a user activates a dated-event label within an Employee card
- **THEN** the Calendar opens that label's current, future, and conditional past event history
