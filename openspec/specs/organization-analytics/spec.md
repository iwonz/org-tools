# organization-analytics Specification

## Purpose
Define bounded organization analytics, birth-year and age summaries, and actionable current-data
drill-downs.
## Requirements
### Requirement: Analytics reports known birth years and completed ages
Analytics SHALL derive a birth-year distribution and age summary from valid known Employee
birthdays. A missing birthday and year `1900` MUST be excluded from both outputs. Age SHALL be the
number of completed years on the current local calendar date, and average ages SHALL retain one
decimal of display precision.

#### Scenario: Build known birth-year distribution
- **WHEN** Employees contain known, unknown-year, and missing birthdays
- **THEN** each known year has one count entry and the unknown or missing birthdays have none

#### Scenario: Calculate age on a birthday boundary
- **WHEN** Analytics is calculated immediately before or on an Employee birthday
- **THEN** completed age changes only on the birthday and the average uses that completed age

### Requirement: Age cohorts expose deterministic summaries
Analytics SHALL expose `all`, `male`, and `female` cohorts with average age, youngest Employee, and
oldest Employee. Unspecified gender SHALL contribute only to `all`. Equal birthdays SHALL resolve by
localized name order and then stable Employee UUID.

#### Scenario: Compare organization and gender cohorts
- **WHEN** known birthdays exist for male, female, and unspecified Employees
- **THEN** the overall summary includes all three and gender summaries include only their exact gender

#### Scenario: Render an empty cohort
- **WHEN** a cohort has no known birthdays
- **THEN** its average and extremes render as unavailable without inventing an age or Employee

### Requirement: Analytical drill-down uses current actionable Employee cards
Every count-table Eye action SHALL open a bounded virtualized list of current full Employee cards
with Tag, Edit, and Delete actions. The view SHALL resolve its entry from current Analytics after an
organization mutation instead of retaining a stale Employee snapshot.

#### Scenario: Edit an Employee from drill-down
- **WHEN** an Employee is edited from an analytical group
- **THEN** the organization updates through the ordinary Employee workflow and the group re-resolves

#### Scenario: Remove the final group member
- **WHEN** deleting an Employee removes the current analytical entry
- **THEN** the stale entry and its Employee card are no longer displayed

### Requirement: Analytics content avoids duplicate chrome
Populated Analytics SHALL begin with analytical content and MUST NOT repeat the shared header title
or a total-Employee subtitle inside its workflow body.

#### Scenario: Open populated Analytics
- **WHEN** the shared application header already identifies Analytics
- **THEN** the body begins with the age and count surfaces without another Analytics heading

### Requirement: Analytics remains bound to the system View
Analytics SHALL derive Unit-scoped membership and position context exclusively from the system View
and SHALL NOT expose a View selector. Custom View selection or mutation SHALL NOT change Analytics
until a global Employee field changes.

#### Scenario: Open Analytics after selecting a custom View
- **WHEN** the Editor has a custom View active
- **THEN** Analytics continues to show the canonical system organization

#### Scenario: Rearrange only a custom View
- **WHEN** custom Units or memberships change without a global Employee mutation
- **THEN** the system Analytics cache and results remain unchanged
