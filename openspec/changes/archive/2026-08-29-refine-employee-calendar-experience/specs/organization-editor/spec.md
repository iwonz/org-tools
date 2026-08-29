## ADDED Requirements

### Requirement: Editor commands retain readable interaction feedback
Editor toolbar and command controls SHALL use an opaque tonal hover surface with readable foreground
contrast and SHALL NOT fade the command into the canvas.

#### Scenario: Hover an Editor command
- **WHEN** a pointer hovers an available Editor toolbar or command action in either theme
- **THEN** its label and icon remain fully legible on an opaque accent surface without changing
  control geometry

### Requirement: Employee and Unit forms avoid redundant chrome
Employee create and edit forms SHALL expose a Gender selector and SHALL omit visible storage-scope
and avatar-format helper paragraphs. The Unit form SHALL omit a visible Membership mode label while
retaining an accessible name on the mode switch.

#### Scenario: Create or edit Employee
- **WHEN** the Employee form opens
- **THEN** it offers Male, Female, and Not specified gender values without the storage or
  avatar-format helper paragraphs

#### Scenario: Choose Unit membership mode
- **WHEN** the Unit form renders Static and Live tabs
- **THEN** no redundant Membership mode heading is visible and assistive technology still receives
  the localized mode-switch name

### Requirement: Employee filters include gender
The Employee filter popover SHALL provide exact-value gender filtering, include selected genders in
its active count and reset key, and compose the selection with query, birthday, position, tag, and
Unit filters.

#### Scenario: Filter by gender
- **WHEN** a user selects one or more gender values
- **THEN** the Employee list contains Employees matching any selected gender and all other active
  filter sections

#### Scenario: Clear gender filter
- **WHEN** the user clears the Gender section or all filters
- **THEN** no gender constraint remains and the virtualized list resets to the current result start

### Requirement: Calendar dates use consistent interaction geometry
The Calendar SHALL format its heading as a localized month name followed by a bare numeric year,
SHALL render every in-month date as a pointer and keyboard button with the date number fixed in the
same top row, SHALL provide tonal hover and focus feedback, and SHALL distinguish the current date
with a stronger signal treatment than ordinary dates.

#### Scenario: Empty and populated dates
- **WHEN** one empty date and one event date render in the same month
- **THEN** both are actionable buttons with their date numbers aligned to the same top position and
  both expose pointer hover feedback

#### Scenario: Current date
- **WHEN** the displayed month contains today
- **THEN** today's date badge and cell treatment remain clearly distinguishable in either theme

#### Scenario: Russian month heading
- **WHEN** the Russian interface displays August 2026
- **THEN** the heading contains only the localized month name and numeric year, without an
  abbreviated or full year suffix

### Requirement: Calendar day Employee rows support catalog actions
The Calendar day dialog SHALL omit its redundant descriptive label, SHALL render its Employee list
without extra outer horizontal padding, and SHALL expose the same tag, edit, and delete actions as
the ordinary Employee catalog. The open day SHALL re-derive Employees from current indexes after a
mutation.

#### Scenario: Manage birthday Employee
- **WHEN** a user opens a day with a birthday Employee
- **THEN** the row exposes tag, edit, and delete actions aligned on the right without extra list-side
  padding

#### Scenario: Employee mutation updates open day
- **WHEN** an Employee is edited or deleted from the Calendar day dialog
- **THEN** the current dialog list reflects the updated indexes without a stale Employee snapshot

#### Scenario: Calendar day dialog heading
- **WHEN** a Calendar day dialog opens
- **THEN** the date remains its title and no “Birthdays and dated tags for this day” description is
  rendered
