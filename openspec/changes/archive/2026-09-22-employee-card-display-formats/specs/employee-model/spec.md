## ADDED Requirements

### Requirement: Employee model owns card display formats
The Employee model SHALL retain field configuration under Model and expose a Display tab containing
Employees section, Units section, Editor card, and Editor export card formats. Each format SHALL use
the shared token input and a live destination preview. The four-value draft MUST commit atomically on
Save and MUST be discarded when the dialog closes without saving.

#### Scenario: Preview and save display formats
- **WHEN** a user edits formats and saves the Display tab
- **THEN** every preview updates before Save and all four persisted formats change in one organization mutation

#### Scenario: Cancel display changes
- **WHEN** a user edits a format and closes the dialog without saving
- **THEN** no display format or organization revision changes

### Requirement: Employee display formats use contextual template values
Each format MUST use the existing `@`, `{token}`, and conditional grammar and offer built-in
Employee fields, contextual Unit fields, Tags, and every custom field while excluding avatar data.
Array values SHALL join with `; ` and Composite values SHALL use their existing deterministic text
serialization. Employees and fallback cards MUST aggregate every system-View assignment in
structural order and treat `isBoss` as true when any assignment is managed. Units, Editor, and PNG
rows MUST resolve Unit fields from the one containing Unit.

#### Scenario: Render one Employee in different contexts
- **WHEN** one Employee belongs to multiple system Units and appears inside one selected Unit
- **THEN** Employees joins every assignment while the Units card and drag preview show only the selected Unit context

#### Scenario: Preview a format
- **WHEN** Display opens with a non-empty catalog
- **THEN** list previews use the first suitable system-View Employee and Editor previews use the first suitable active-View Employee

#### Scenario: Preview without Employees
- **WHEN** Display opens with an empty Employee catalog
- **THEN** all previews render a transient synthetic example without persisting it

### Requirement: Employee cards render configured information columns
Employee cards SHALL render the non-empty lines of their applicable format as the complete
information column beside the avatar. The first line SHALL use primary emphasis, later lines SHALL
use secondary emphasis, and each line SHALL truncate horizontally. Avatar, boss marker, card actions,
search highlighting, safe explicit profile and email navigation, and the full-name accessible label
MUST remain available independently of formatted content.

#### Scenario: Use the Employees fallback format
- **WHEN** an Employee card is outside Employees, Units, Editor canvas, and Editor PNG contexts
- **THEN** it renders the Employees-section format

#### Scenario: Render an empty format
- **WHEN** the applicable saved format produces no non-whitespace lines
- **THEN** the information column is empty while the avatar, accessible name, and actions remain usable

### Requirement: Required switches use flat rows
Every Required switch row in Employee model SHALL have no surrounding surface fill, border-like
rounding, or extra horizontal and vertical padding while retaining accessible switch semantics.

#### Scenario: Toggle a flat Required switch
- **WHEN** a keyboard user focuses and activates Required
- **THEN** the checked value changes without a surrounding field surface or form submission
