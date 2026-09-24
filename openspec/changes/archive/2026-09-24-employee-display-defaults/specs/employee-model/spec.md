## MODIFIED Requirements

### Requirement: Employee model owns card display formats
The Employee model SHALL retain field configuration under an icon-labeled Model tab and expose an
icon-labeled Display tab containing flat Employees section, Units section, Editor card, and Editor
export card format sections. Each format SHALL use the shared token input with inline Markdown tools,
a 0-24 pixel integer number input for line spacing, a localized normal-weight Reset text action, and
a bordered live destination preview. Every valid format or gap change MUST update the corresponding
stored value immediately. Closing the dialog MUST retain accepted Display changes, and the Display
tab MUST NOT offer a separate Save action. Model-tab custom-field drafts MUST retain their existing
explicit Save workflow. New organizations MUST initialize Employees and Units formats with
`**{fullName}** {positions} {tags}` on one authored line and MUST initialize every line gap to 5
pixels.

The default Editor-export format MUST embed the Manager translation for the creation locale inside
an `isBoss` ternary. A later locale change MUST NOT rewrite that stored user format. Reset MUST derive
the selected format from `createDefaultEmployeeDisplayFormats` for the current locale and MUST NOT
change another format or any line gap.

#### Scenario: Apply a valid format immediately
- **WHEN** a user edits one Display format to a different valid string
- **THEN** its preview, every matching card, persisted organization, and synchronized live tab receive that format without a Save action

#### Scenario: Apply a valid line gap immediately
- **WHEN** a user enters an integer from 0 through 24 in one line-gap input
- **THEN** that context uses and persists the value immediately while the other three gaps remain unchanged

#### Scenario: Normalize an intermediate number
- **WHEN** a line-gap input temporarily contains blank, fractional, nonnumeric, or out-of-range text
- **THEN** invalid text does not enter State and blur or Enter clamps a parseable value or restores the latest valid stored value

#### Scenario: Close after editing Display
- **WHEN** a user changes a format or line gap and closes and reopens the dialog
- **THEN** every accepted change remains present and the Display tab still has no Save action

#### Scenario: Reset one format
- **WHEN** a user activates Reset for one Display section after changing its format and line gap
- **THEN** only that format becomes the current locale's maintained default, the action uses normal font weight, and its line gap and every other section remain unchanged

#### Scenario: Inspect the Display layout
- **WHEN** the Employee model opens either top-level tab
- **THEN** Model and Display show thematic accessible icons and each Display section has no enclosing fill, rounding, or padding while its preview retains its boundary and card spacing

#### Scenario: Create a new organization
- **WHEN** blank State is created in a supported locale
- **THEN** Employees and Units use the one-line `**{fullName}** {positions} {tags}` format, all line gaps equal 5, and Editor export contains that locale's Manager literal inside an `isBoss` ternary
