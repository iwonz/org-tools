## MODIFIED Requirements

### Requirement: Calendar and analytics use normalized birthdays
The application SHALL use nullable complete `DD.MM.YYYY` birthdays, treat `1900` as unknown, and
derive shared birthday indexes. Calendar SHALL navigate across years, project leap-day birthdays,
include exact-date Tags, align dates under locale-ordered weekdays, and style actual Saturday and
Sunday cells with one restrained weekend tone. Russian weeks SHALL begin Monday and English weeks
SHALL begin Sunday.

#### Scenario: Calendar week alignment
- **WHEN** a month begins after the locale's first weekday
- **THEN** leading placeholders align every date below its localized weekday heading

#### Scenario: Weekend styling
- **WHEN** Saturday or Sunday renders in either locale order
- **THEN** its heading and current-month date cell use the same dedicated tonal surface

#### Scenario: Birthday display
- **WHEN** an Employee has a valid birthday in the displayed month
- **THEN** the Employee appears on the recurring day with existing leap-day behavior

### Requirement: Calendar exposes dated tag events and details
Calendar day cells SHALL retain birthday avatars but SHALL represent all dated Tag assignments with
one Tag icon and localized assignment count, without inline Tag labels or a duplicate total-event
count. The day dialog SHALL retain one vertical virtualized stream with Birthdays first and each Tag
heading followed by complete shared Employee cards.

#### Scenario: Render a populated day
- **WHEN** a date contains multiple dated Tag assignments
- **THEN** its cell shows one Tag icon and total assignment count without any Tag label

#### Scenario: Open a populated day
- **WHEN** a user activates a day containing birthdays and dated Tags
- **THEN** one dialog scroll renders nonempty Birthdays and Tag groups with ordinary Employee cards

### Requirement: Calendar provides a bounded dated-Tag rail
Calendar SHALL place dated Tag controls in a single-line horizontally scrollable rail on the left of
the same desktop header row as fixed month navigation. The Employee Calendar title and aggregate
event count SHALL NOT render. On narrow screens the rail SHALL stack above navigation.

#### Scenario: Scroll many dated Tags
- **WHEN** Tag controls exceed the available desktop width
- **THEN** only the left rail scrolls horizontally while month navigation remains visible

#### Scenario: Open a Tag from the rail
- **WHEN** a Tag control is activated
- **THEN** its existing virtualized current, future, and conditional past history opens

## ADDED Requirements

### Requirement: Calendar returns to the current month
Month navigation SHALL show a localized Today action only when the displayed local month or year is
not current. Activating it SHALL restore the current local month and year.

#### Scenario: Return to today
- **WHEN** a user navigates away from the current month and activates Today
- **THEN** Calendar displays the current month and the Today action disappears
