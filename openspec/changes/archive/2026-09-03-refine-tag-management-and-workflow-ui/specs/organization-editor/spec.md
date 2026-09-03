## MODIFIED Requirements

### Requirement: Calendar dates use consistent interaction geometry
The Calendar SHALL format its month heading through the active locale with a bare numeric year,
render every in-month date as an actionable button with a fixed date-number row, and distinguish
real Saturday and Sunday headings and cells through a stable theme-aware light rose treatment. A
current weekend SHALL retain that rose surface while the signal date badge remains the dominant
current-day cue. A day-dialog title SHALL preserve locale order while omitting the abbreviated
Russian year suffix. Previous and Next navigation SHALL use the reviewed labels from the active
catalog.

#### Scenario: Empty and populated dates
- **WHEN** one empty date and one event date render in the same month
- **THEN** both are buttons with aligned numbers and stable hover feedback

#### Scenario: Weekend dates
- **WHEN** a displayed date falls on Saturday or Sunday
- **THEN** its weekday heading and cell use the same restrained rose family in both themes

#### Scenario: Current weekend date
- **WHEN** today falls on a weekend in the displayed month
- **THEN** the cell retains weekend context and the date badge remains clearly current

#### Scenario: Current date
- **WHEN** the displayed month contains today
- **THEN** today's date badge and cell treatment remain clearly distinguishable in either theme

#### Scenario: Russian month heading
- **WHEN** the Russian interface displays August 2026
- **THEN** the heading contains only the localized month name and numeric year, without an
  abbreviated or full year suffix

#### Scenario: Open localized date details
- **WHEN** a user opens a day in any supported locale
- **THEN** the title follows that locale and contains no obsolete Russian year suffix

#### Scenario: Navigate in Russian
- **WHEN** Russian Calendar navigation is exposed
- **THEN** its backward and forward controls use the reviewed Russian catalog labels
