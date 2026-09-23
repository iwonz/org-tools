## MODIFIED Requirements

### Requirement: Employee model owns card display formats
The Employee model SHALL retain field configuration under an icon-labeled Model tab and expose an
icon-labeled Display tab containing flat Employees section, Units section, Editor card, and Editor
export card format sections. Each format SHALL use the shared token input with inline Markdown tools
and a bordered live destination preview. The four-value draft MUST commit atomically on Save and MUST
be discarded when the dialog closes without saving. New organizations MUST initialize Employees and
Units formats with `{fullName}`, `{username}`, `{email}`, `{positions}`, and `{tags}` on separate
lines while retaining the existing Editor and Editor-export defaults.

#### Scenario: Preview and save display formats
- **WHEN** a user edits formats and saves the Display tab
- **THEN** every preview updates before Save and all four persisted formats change in one organization mutation

#### Scenario: Cancel display changes
- **WHEN** a user edits a format and closes the dialog without saving
- **THEN** no display format or organization revision changes

#### Scenario: Inspect the Display layout
- **WHEN** the Employee model opens either top-level tab
- **THEN** Model and Display show thematic accessible icons and each Display section has no enclosing fill, rounding, or padding while its preview retains its boundary and card spacing

#### Scenario: Create a new organization
- **WHEN** blank State is created
- **THEN** Employees and Units formats use the compound `{positions}` token without rewriting any format loaded from State

### Requirement: Employee display formats use contextual template values
Each format MUST use the existing `@`, `{token}`, and conditional grammar and offer built-in
Employee fields, contextual Unit fields, Tags, the display-only `{positions}` token, and every
custom field while excluding avatar data. Ordinary array values, including `{position}` and
`{unitName}`, SHALL join with `; ` and Composite values SHALL use their existing deterministic text
serialization. `{tags}` MUST retain ordered Tag objects and `{positions}` MUST retain every ordered
contextual assignment as a semantic display group. Employees and fallback cards MUST aggregate
every system-View assignment in structural order and treat `isBoss` as true when any assignment is
managed. Units, Editor, and PNG rows MUST resolve Unit fields from the one containing Unit.

#### Scenario: Render one Employee in different contexts
- **WHEN** one Employee belongs to multiple system Units and appears inside one selected Unit
- **THEN** Employees renders one ordered `Position · Unit` pill for every assignment while the Units card and drag preview use only the selected Unit assignment

#### Scenario: Render independent Unit values
- **WHEN** a format uses `{position}` and `{unitName}` without `{positions}`
- **THEN** each token renders ordinary text joined with `; ` and receives ordinary Markdown formatting

#### Scenario: Render an assignment without a position
- **WHEN** a contextual assignment has no position and the format contains `{positions}`
- **THEN** its pill uses the localized missing-position label followed by a middle dot and the Unit name

#### Scenario: Preserve an existing custom positions key
- **WHEN** loaded State already defines a custom field whose normalized key is `positions`
- **THEN** that custom field remains valid and resolves in Display until renamed while new fields cannot claim that key

#### Scenario: Preview a format
- **WHEN** Display opens with a non-empty catalog
- **THEN** list previews use the first suitable system-View Employee and Editor previews use the first suitable active-View Employee

#### Scenario: Preview without Employees
- **WHEN** Display opens with an empty Employee catalog
- **THEN** all previews render a transient synthetic example without persisting it

### Requirement: Employee cards render configured information columns
Employee cards SHALL render each non-empty format line as inline Markdown containing ordinary text,
bold, italic, strike, inline code, safe links, native Tag chips, and native compound assignment
pills. Every line in one context SHALL use the same base size, color, and normal weight; Markdown
alone controls text emphasis. Text SHALL truncate horizontally while semantic Tag and assignment
groups MAY wrap complete chips. Each assignment pill MUST render the position with foreground
emphasis, a middle dot, and the Unit name with secondary styling. Avatar, boss marker, card actions,
search highlighting, safe explicit profile, Markdown and Unit navigation, and the full-name
accessible label MUST remain available independently of formatted content. `{email}` MUST remain
ordinary text unless an author places it in an explicit safe Markdown link.

#### Scenario: Use the Employees fallback format
- **WHEN** an Employee card is outside Employees, Units, Editor canvas, and Editor PNG contexts
- **THEN** it renders the Employees-section rich format

#### Scenario: Render an empty format
- **WHEN** the applicable saved format produces no visible text, Tags, or assignments
- **THEN** the information column is empty while the avatar, accessible name, and actions remain usable

#### Scenario: Preserve native fields
- **WHEN** a format contains `{tags}` and `{positions}` with Markdown text before or after them
- **THEN** Tags retain catalog colors and localized dates, assignments retain compound pill styling, and adjacent text retains its Markdown marks

#### Scenario: Render plain and linked email
- **WHEN** one format contains `{email}` and another contains `[{email}](mailto:{email})`
- **THEN** the first value is ordinary text and the second is an explicit safe link in interactive list cards

#### Scenario: Keep values inert
- **WHEN** an Employee or custom field value contains Markdown punctuation or HTML
- **THEN** that value renders verbatim without creating formatting, embedded content, or a request
