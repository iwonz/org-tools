## MODIFIED Requirements

### Requirement: Calendar day dialogs omit absent dated-tag content
The application SHALL render only populated content in one vertical Calendar day-dialog flow. A
nonempty Birthday section SHALL appear first. Dated events SHALL be grouped by normalized tag label,
with one interactive localized tag heading followed by complete shared Employee cards with ordinary
identity, Unit, Tag, Edit, and Delete content. Activating a tag heading SHALL open its existing tag
history. Groups SHALL sort by localized label, Employees SHALL use stable name order, and an Employee
with multiple labels on the day SHALL appear once in every corresponding tag group. The dialog SHALL
use one mixed section-header/Employee-row virtualizer and one body scroll, without a special event
subtitle inside an Employee card or an empty reserved section.

#### Scenario: Birthday-only day
- **WHEN** a user opens a Calendar day that has birthdays and no dated-tag events
- **THEN** the dialog shows one Birthday heading followed by complete Employee cards
- **AND** no dated-tag heading, empty message, or empty second column is rendered

#### Scenario: Dated-tag-only day
- **WHEN** a user opens a Calendar day that has dated-tag events and no birthdays
- **THEN** each tag appears as an interactive heading above its complete actionable Employee cards
- **AND** no Birthday heading, special event subtitle, or empty first column is rendered

#### Scenario: Day with birthdays and dated tags
- **WHEN** a user opens a Calendar day that has birthdays and multiple dated tags
- **THEN** Birthdays appear first and every localized tag group follows from top to bottom in one scroll

#### Scenario: Multiple labels for one Employee
- **WHEN** one Employee has multiple dated tags on the selected day
- **THEN** that Employee appears under each corresponding tag heading
- **AND** activating either heading opens that label's dated-tag history
