## MODIFIED Requirements

### Requirement: Calendar and analytics use normalized birthdays
The application SHALL use nullable complete `DD.MM.YYYY` birthdays for Employee forms and exports,
SHALL derive recurring day-and-month indexes for Calendar and birthday analytics, and SHALL treat
year `1900` as unknown. Employee create and edit SHALL provide coordinated styled Day, Month, and
Year selectors, including an explicit unknown-year choice, and SHALL reject incomplete or impossible
selections. Calendar SHALL navigate a selected month and year across year boundaries, SHALL project
February 29 birthdays to February 28 in non-leap years independent of whether their birth year is
known, SHALL include exact-date Employee tag events, SHALL fit a 31-day grid and bounded tag cloud
without page scroll at the maintained 1280 by 720 desktop viewport, and SHALL render Analytics as
six content-sized groups in one full-bleed workflow with compact gaps and one uniform soft tonal
surface per group. Groups SHALL add no outer border, shadow, nested header fill, or repeated row
rule. Each Analytics group SHALL show at most eight estimated 42 px rows before using its existing
virtualized internal scroll container.

#### Scenario: Birthday selection
- **WHEN** a user creates or edits an Employee birthday
- **THEN** styled Day, Month, and Year selectors produce one valid canonical complete date or null
- **AND** selecting Unknown year persists the chosen day and month with year `1900`

#### Scenario: Birthday display
- **WHEN** an Employee has a valid birthday and the calendar displays the corresponding year and month
- **THEN** the Employee appears on the matching recurring day, using February 28 for a February 29 birthday in a non-leap display year, and in birthday aggregates

#### Scenario: Calendar navigation layout
- **WHEN** Calendar has birthday or dated-tag data on a maintained desktop viewport
- **THEN** its header shows month and year followed by Previous and Next, and the remaining cloud and grid fit without horizontal or vertical page overflow

#### Scenario: Tonal Analytics surface
- **WHEN** Analytics is ready
- **THEN** all six sortable virtualized groups and drill-down actions remain available in a
  full-bleed workflow with two desktop columns and one narrow-screen column
- **AND** each group uses one uniform borderless tone from heading through rows, while compact gaps,
  typography, scrolling, and hover or focus feedback preserve hierarchy

#### Scenario: Short Analytics group
- **WHEN** an Analytics group contains fewer than eight entries
- **THEN** the group height follows its title, table header, and rendered rows without reserving a fixed 384 px block

#### Scenario: Long Analytics group
- **WHEN** an Analytics group contains more than eight entries
- **THEN** eight rows remain visible and additional virtualized rows are reachable through internal scrolling
