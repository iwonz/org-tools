## MODIFIED Requirements

### Requirement: Employee model owns card display formats
The Employee model SHALL retain field configuration under an icon-labeled Model tab and expose an
icon-labeled Display tab containing flat Employees section, Units section, Editor card, and Editor
export card format sections. Each format SHALL use the shared token input with inline Markdown tools,
a 0-24 pixel integer line-gap slider with a numeric pixel readout, and a bordered live destination
preview. The four format strings and four line gaps MUST commit atomically on Save and MUST be
discarded when the dialog closes without saving. New organizations MUST initialize Employees and
Units formats with `{fullName}`, `{username}`, `{email}`, `{positions}`, and `{tags}` on separate
lines and MUST initialize every line gap to 4 pixels.

The default Editor-export format MUST embed the Manager translation for the creation locale inside
an `isBoss` ternary. A later locale change MUST NOT rewrite that stored user format.

#### Scenario: Preview and save display formats
- **WHEN** a user edits formats or line gaps and saves the Display tab
- **THEN** every preview updates before Save and all eight persisted values change in one organization mutation

#### Scenario: Cancel display changes
- **WHEN** a user edits a format or line gap and closes the dialog without saving
- **THEN** no display setting or organization revision changes

#### Scenario: Inspect the Display layout
- **WHEN** the Employee model opens either top-level tab
- **THEN** Model and Display show thematic accessible icons and each Display section has no enclosing fill, rounding, or padding while its preview retains its boundary and card spacing

#### Scenario: Create a new organization
- **WHEN** blank State is created in a supported locale
- **THEN** Employees and Units use `{positions}`, all line gaps equal 4, and Editor export contains that locale's Manager literal inside an `isBoss` ternary

### Requirement: Employee display formats use contextual template values
Each format MUST use the existing `@`, `{token}`, and conditional grammar and offer built-in
Employee fields, contextual Unit fields, Tags, the display-only `{positions}` token, and every
custom field while excluding avatar data. Ordinary array values, including `{position}` and
`{unitName}`, SHALL join with `; ` and Composite values SHALL use their existing deterministic text
serialization. `{tags}` MUST retain ordered Tag objects and `{positions}` MUST retain every ordered
contextual assignment as a semantic display group. Employees and fallback cards MUST aggregate
every system-View assignment in structural order and resolve `isBoss` to boolean true when any
assignment is managed. Units, Editor, and PNG rows MUST resolve Unit fields from the one containing
Unit. Direct `{isBoss}` output MUST be empty; visible boss text MUST be authored in a ternary branch.

#### Scenario: Render one Employee in different contexts
- **WHEN** one Employee belongs to multiple system Units and appears inside one selected Unit
- **THEN** Employees renders one ordered `Position · Unit` pill for every assignment while the Units card and drag preview use only the selected Unit assignment

#### Scenario: Render independent Unit values
- **WHEN** a format uses `{position}` and `{unitName}` without `{positions}`
- **THEN** each token renders ordinary text joined with `; ` and receives ordinary Markdown formatting

#### Scenario: Render an assignment without a position
- **WHEN** a contextual assignment has no position and the format contains `{positions}`
- **THEN** its pill uses the localized missing-position label followed by a middle dot and the Unit name

#### Scenario: Render boss conditionally
- **WHEN** a boss row uses `{isBoss ? 'Manager' : ''}` and another row uses direct `{isBoss}`
- **THEN** the ternary renders its literal while the direct token produces no visible text

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
Employee cards SHALL render authored format lines as inline Markdown containing ordinary text,
bold, italic, strike, inline code, safe links, native Tag chips, and native compound assignment
pills. Internal source-authored blank lines between visible content SHALL reserve one empty row;
leading and trailing blank lines and lines emptied only by absent values or false conditions SHALL
be omitted. Ordinary text MUST wrap by words to the available width with character fallback for an
oversized uninterrupted value. Every line in one context SHALL use the same base size, color, and
normal weight; Markdown alone controls text emphasis.

The selected pixel gap SHALL separate text and format rows without trailing space after the final
row. Semantic Tag and assignment groups MAY wrap complete chips while retaining their native
internal geometry. Each assignment pill MUST render the position with foreground emphasis, a
middle dot, and the Unit name with secondary styling. Avatar, boss marker, card actions, search
highlighting, safe explicit profile, Markdown and Unit navigation, and the full-name accessible
label MUST remain available independently of formatted content. `{email}` MUST remain ordinary
text unless an author places it in an explicit safe Markdown link.

#### Scenario: Use the Employees fallback format
- **WHEN** an Employee card is outside Employees, Units, Editor canvas, and Editor PNG contexts
- **THEN** it renders the Employees format and Employees line gap

#### Scenario: Preserve authored rows
- **WHEN** visible format lines contain an internal blank line and long text exceeding card width
- **THEN** the blank row remains, the text wraps by words or characters, and only configured inter-row gaps are added

#### Scenario: Drop dynamic empty rows
- **WHEN** a complete source line contains only an absent field or a false conditional branch
- **THEN** that line contributes no visible row or spacing

#### Scenario: Render an empty format
- **WHEN** the applicable saved format produces no visible text, Tags, assignments, or internal blank row between content
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

## ADDED Requirements

### Requirement: Built-in Employee fields expose their scope
The Employee model SHALL show Employee-owned fields separately from Unit-context fields. The
Employee group MUST contain `id`, `firstName`, `lastName`, `fullName`, `gender`, `username`,
`profileUrl`, `email`, `phone`, `birthday`, `tags`, and `tagDates`. The Unit-context group MUST
contain `unitId`, `unitName`, `unitFullPath`, `position`, display-only `positions`, and `isBoss`.
Custom Template fields MUST suggest only Employee-owned and custom fields, while Employee display
formats MUST suggest both groups and every applicable custom field.

#### Scenario: Inspect built-in fields
- **WHEN** the Model tab is open
- **THEN** Employee and Unit-context tokens appear under separate localized headings and `positions` is identified as display-only

#### Scenario: Edit a custom Template field
- **WHEN** its token suggestions open
- **THEN** unavailable Unit-context and display-only tokens are absent while Employee-owned and safe custom dependencies remain available
