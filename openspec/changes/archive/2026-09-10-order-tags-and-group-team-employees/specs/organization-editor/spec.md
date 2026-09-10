## MODIFIED Requirements

### Requirement: Calendar exposes dated tag events and details
Calendar day cells SHALL retain birthday avatars but SHALL represent all dated Tag assignments with
one Tag icon and localized assignment count, without inline Tag labels or a duplicate total-event
count. The day dialog SHALL retain one vertical virtualized stream with Birthdays first and each Tag
heading followed by complete shared Employee cards. Dated groups SHALL follow catalog order,
Employees SHALL use stable name order, and the same Employee SHALL appear in each applicable group.
Cards MUST NOT contain a special event-label subtitle.

#### Scenario: Render a populated day
- **WHEN** a date contains multiple dated Tag assignments
- **THEN** its cell shows one Tag icon and total assignment count without any Tag label

#### Scenario: Open a populated day
- **WHEN** a user activates a day containing birthdays and dated tags
- **THEN** one dialog scroll renders Birthdays first and each populated tag heading followed by complete Employee cards
- **AND** no empty group, second column, Dated tags heading, or event subtitle is rendered

#### Scenario: Open tag history from a day
- **WHEN** a user activates a dated-event group heading
- **THEN** the Calendar opens that label's current, future, and conditional past event history


## ADDED Requirements

### Requirement: Unit settings control contiguous Tag grouping
Each Unit SHALL expose a settings gear beside its note action on hover, keyboard focus, and non-hover devices. Its Dialog SHALL contain only a Group by tag switch, enabled by default and applied immediately as one undoable View-local document command. Pointer activation MUST NOT initiate canvas selection, drag, or editing. Copy and View cloning SHALL retain the setting independently.

#### Scenario: Toggle grouping
- **WHEN** the Unit settings switch changes
- **THEN** that Unit updates immediately and one Undo restores the previous setting

#### Scenario: Group Employees
- **WHEN** grouping is enabled for a manual or Live Unit
- **THEN** the boss appears once first, each remaining Employee belongs only to their earliest catalog Tag, groups follow catalog order, tagless Employees follow last, and each group uses stable full-name order without headings or separators

#### Scenario: Disable grouping
- **WHEN** grouping is disabled
- **THEN** the boss remains first followed by one stable alphabetic Employee list

#### Scenario: Reorder shared Tags
- **WHEN** the catalog order changes
- **THEN** every View re-derives grouped rows, PNG, virtual offsets, navigation, and distribution anchors from the same Employee sequence without changing membership or counts
