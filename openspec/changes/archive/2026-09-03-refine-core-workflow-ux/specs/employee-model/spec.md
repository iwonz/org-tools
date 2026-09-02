## ADDED Requirements

### Requirement: Employee forms compose draft controls consistently
Employee create and edit forms SHALL represent Gender as a three-option native-radio segmented
control for Male, Female, and Not specified with one boundary, neutral internal dividers, keyboard
navigation, and tonal selection that does not change geometry. Birthday SHALL retain three
independent Day, Month, and Year Select values inside one compound boundary with internal dividers,
one focus treatment, and only outer corner radii. Changing month or year SHALL clear a now-impossible
day while preserving current `DD.MM.YYYY` and unknown-year `1900` semantics.

Tags SHALL use one shared picker whose closed trigger wraps every selected Tag chip without a `+N`
summary or separate selected list. A dated chip SHALL show its localized date after a middle dot.
The virtualized popover SHALL support search, create, checkbox selection, and an optional date per
row, while changing only the form draft until the form's Save succeeds. Unit assignments SHALL use
the single visible label `Units`, accessible name `Select Units`, and validation `Select at least one
Unit` in every Employee form mode.

#### Scenario: Choose gender with radio semantics
- **WHEN** a keyboard or pointer user chooses a Gender segment
- **THEN** exactly one native radio is selected and only its tonal fill changes within the stable shared boundary

#### Scenario: Enter a compound birthday
- **WHEN** a user chooses Day, Month, and Year
- **THEN** the three adjacent Selects expose one compound control and produce one valid canonical birthday or null

#### Scenario: Invalidate a selected birthday day
- **WHEN** a selected day does not exist after month or year changes
- **THEN** Day is cleared and no invalid birthday enters the draft

#### Scenario: Edit draft Tags
- **WHEN** a user searches, creates, selects, dates, or clears Tags before saving the Employee form
- **THEN** every current draft Tag is visible inside the wrapping trigger and organization state remains unchanged

#### Scenario: Save draft Tags
- **WHEN** the user saves a valid Employee form after editing Tags
- **THEN** the final draft Tags are committed together with the Employee and ordinary persistence runs once

#### Scenario: Use Unit terminology in Editor mode
- **WHEN** an Editor-originated Employee form renders or fails Unit validation
- **THEN** it uses only the generic localized Unit label, picker name, and validation message
