## MODIFIED Requirements

### Requirement: Calendar and analytics use normalized birthdays
The application SHALL use nullable `MM-DD` birthdays for Calendar and birthday analytics, SHALL navigate a selected month and year across year boundaries, SHALL project February 29 birthdays to February 28 in non-leap years, SHALL include exact-date global Main Employee tag events, SHALL fit a 31-day grid and bounded tag cloud without page scroll at the maintained 1280 by 720 desktop viewport, and SHALL render Analytics as one continuous surface without a bordered card lattice.

#### Scenario: Birthday display
- **WHEN** an Employee has a valid birthday and the calendar displays the corresponding year and month
- **THEN** the Employee appears on the matching day, using February 28 for a February 29 birthday in a non-leap year, and in birthday aggregates

#### Scenario: Calendar navigation layout
- **WHEN** Calendar has birthday or dated-tag data on a maintained desktop viewport
- **THEN** its header shows month and year followed by Previous and Next, and the remaining cloud and grid fit without horizontal or vertical page overflow

#### Scenario: Continuous Analytics surface
- **WHEN** Analytics is ready
- **THEN** all six sortable virtualized groups and drill-down actions remain available without separate card backgrounds or the outer border matrix

## ADDED Requirements

### Requirement: Calendar exposes dated tag events and details
The Calendar SHALL show exact-date tag events separately from birthday avatars, limit a day cell to two inline tag events plus an overflow count, and open a localized day dialog with Birthday and Dated tags sections.

#### Scenario: Open a populated day
- **WHEN** a user activates a day containing birthdays and dated tags
- **THEN** the dialog lists both event sections with their Employees and labels

### Requirement: Calendar provides a bounded dated-tag cloud
The Calendar SHALL show all dated tag labels from global Main Employees as localized chips with event counts in at most two rows, disclose overflow without expanding the page, and open a virtualized dialog for the selected label.

#### Scenario: Open a tag from the cloud
- **WHEN** a user activates a dated-tag cloud chip
- **THEN** current and future events appear in ascending date order and past events appear separately in descending date order with localized dates and Employees

#### Scenario: Calendar empty state
- **WHEN** no global Main Employee has either a birthday or a dated tag
- **THEN** the shared Calendar empty state is shown instead of the cloud and grid
