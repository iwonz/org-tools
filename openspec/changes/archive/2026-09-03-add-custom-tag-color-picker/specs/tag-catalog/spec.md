## MODIFIED Requirements

### Requirement: Tags use stable catalog definitions
The system SHALL persist Tags as UUID-keyed global definitions with a unique normalized label and an
optional color that is either a named supplied preset or a canonical lowercase six-digit HEX value.
Employee assignments SHALL reference Tag IDs and retain only an optional exact date. Unassigned
definitions SHALL remain until explicitly deleted.

#### Scenario: Rename a Tag
- **WHEN** a Tag receives a new unique label
- **THEN** every Employee assignment retains the same Tag ID and displays the new label

#### Scenario: Reject a duplicate label
- **WHEN** a label matches another Tag after Unicode normalization and case-folding
- **THEN** the change is rejected without merging definitions or assignments

#### Scenario: Reject an invalid custom color
- **WHEN** a state contains a malformed, uppercase, short, or alpha HEX Tag color
- **THEN** strict validation rejects the complete state without mutation

### Requirement: Users manage Tags centrally
The Employees header SHALL expose a Tag dialog with search, label, one color dropdown, Employee
count, dated-assignment count, rename, color reset, and confirmed deletion. The dropdown SHALL place
a full-spectrum color picker above localized named presets and No color. Deleting a definition SHALL
atomically remove its assignments, filters, and output exclusions.

#### Scenario: Choose an arbitrary color
- **WHEN** a user chooses a color from the full palette
- **THEN** the draft stores its canonical lowercase six-digit HEX value and previews the resulting Tag fill

#### Scenario: Choose a named color
- **WHEN** a user selects a localized named preset below the palette
- **THEN** the draft stores that semantic preset, previews its filled surface, and closes the dropdown

#### Scenario: Reset a Tag color
- **WHEN** a user selects No color
- **THEN** the draft uses the neutral Tag treatment and no color marker appears

#### Scenario: Delete an assigned Tag
- **WHEN** the user confirms deletion after seeing affected counts
- **THEN** the definition and all references disappear in one organization mutation

### Requirement: Assignment controls reflect catalog colors
Every Tag assignment surface SHALL display the current global named or custom color as its own
restrained tonal fill with a readable matching foreground in light and dark themes. Tag chips,
assignment pickers, catalog identity labels, and Calendar Tag controls MUST NOT add a separate
leading color dot. Color SHALL be editable only in the central Tag dialog. A new Tag staged in an
Employee form SHALL use the neutral no-color fill and SHALL enter the catalog only when the Employee
save succeeds.

#### Scenario: Render a colored Tag
- **WHEN** a Tag with a named or custom catalog color appears in an Employee chip, assignment picker, catalog, or Calendar
- **THEN** the Tag surface uses a readable tonal form of that color as its fill and no leading color dot is rendered

#### Scenario: Render a neutral Tag
- **WHEN** a Tag has no configured color
- **THEN** its surface uses the neutral Tag treatment without an empty marker or reserved marker space

#### Scenario: Cancel a new staged Tag
- **WHEN** a user creates a draft Tag and cancels the Employee form
- **THEN** neither the catalog nor the Employee is changed

### Requirement: Palette choices preview the Tag surface
The central Tag color dropdown SHALL show a full-spectrum picker first and each localized named
preset below it using the same filled-surface semantics as rendered Tags rather than a detached
swatch dot.

#### Scenario: Open the Tag color dropdown
- **WHEN** a user opens the Tag color control in either theme
- **THEN** the full palette appears above No color and all named choices without changing dialog geometry

#### Scenario: Preview a custom Tag color
- **WHEN** a user changes the full palette value
- **THEN** the trigger and Tag preview use a readable tonal fill derived from that exact color
