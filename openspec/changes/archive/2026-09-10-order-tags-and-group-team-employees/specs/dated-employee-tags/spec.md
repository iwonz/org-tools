## MODIFIED Requirements

### Requirement: Dated tags are visible without changing label semantics
The application SHALL display every assigned tag without caps or overflow counters, wrap chips onto
additional rows, render dated labels as `label · localized date` with a full-date tooltip, and keep
searching and Live filtering based only on the label, identity based on the catalog ID, and ordering based on the global catalog rather than dates.

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
The application SHALL render only populated content in one vertical Calendar day-dialog flow. A
nonempty Birthday section SHALL appear first. Dated events SHALL be grouped by normalized tag label,
with one interactive localized tag heading followed by complete shared Employee cards with ordinary
identity, Unit, Tag, Edit, and Delete content. Activating a tag heading SHALL open its existing tag
history. Groups SHALL follow catalog order, Employees SHALL use stable name order, and an Employee
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

## ADDED Requirements

### Requirement: Calendar Tag rails follow catalog order
The Calendar dated-Tag rail SHALL follow the global catalog order while each Tag history retains chronological ordering and stable Employee name ordering.

#### Scenario: Reorder dated Tags
- **WHEN** the global Tag order changes
- **THEN** the rail and day-dialog groups reflect that order without changing dates or chronological history
