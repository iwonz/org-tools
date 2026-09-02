## MODIFIED Requirements

### Requirement: Calendar exposes dated tag events and details
The Calendar SHALL show exact-date tag events separately from birthday avatars, limit a day cell to
two inline tag events plus an overflow count, and open a localized day dialog containing one
vertical virtualized stream of populated content. A nonempty Birthday section SHALL come first.
Dated events SHALL be grouped under interactive normalized tag headings sorted by localized label,
and each group SHALL contain complete shared Employee cards with right-aligned Tag, Edit, and Delete
actions in stable name order. The same Employee SHALL appear in each applicable tag group. Cards
MUST NOT contain a special event-label subtitle.

#### Scenario: Open a populated day
- **WHEN** a user activates a day containing birthdays and dated tags
- **THEN** one dialog scroll renders Birthdays first and each populated tag heading followed by complete Employee cards
- **AND** no empty group, second column, Dated tags heading, or event subtitle is rendered

#### Scenario: Open tag history from a day
- **WHEN** a user activates a dated-event group heading
- **THEN** the Calendar opens that label's current, future, and conditional past event history

### Requirement: Employee and Unit forms avoid redundant chrome
Employee create and edit forms SHALL expose Gender as a three-option segmented native-radio control,
Birthday as adjacent Day, Month, and Year Selects in one compound control, Tags as one wrapping
draft picker, and Unit membership with generic Unit terminology. They SHALL omit visible
storage-scope and avatar-format helper paragraphs, a separate selected-Tag list, and Add more copy.
The Unit form SHALL omit a visible Membership mode label while retaining an accessible name on the
mode switch.

#### Scenario: Create or edit Employee
- **WHEN** the Employee form opens
- **THEN** it offers segmented Male, Female, and Not specified, one compound birthday control, all draft Tag chips inside one picker trigger, and generic Unit copy
- **AND** it omits the storage, avatar-format, Add more, and separate Tag-list copy

#### Scenario: Choose Unit membership mode
- **WHEN** the Unit form renders Static and Live tabs
- **THEN** no redundant Membership mode heading is visible and assistive technology still receives the localized mode-switch name

## ADDED Requirements

### Requirement: Unit hierarchy search is always available
The Units hierarchy SHALL render its localized name search for every nonempty Unit structure,
independent of Unit count. Filtering SHALL retain the current hierarchy behavior and bounded derived
indexes without adding a threshold-specific layout.

#### Scenario: Search a small Unit structure
- **WHEN** the current structure contains fewer than twenty Units
- **THEN** the same Unit-name search shown for a large structure remains visible and functional
