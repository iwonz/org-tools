## MODIFIED Requirements

### Requirement: Employee model owns card display formats
The Employee model SHALL retain field configuration under an icon-labeled Model tab and expose an
icon-labeled Display tab containing flat Employees section, Units section, Editor card, and Editor
export card format sections. Each format SHALL use the shared token input with inline Markdown tools
and a bordered live destination preview. The four-value draft MUST commit atomically on Save and MUST
be discarded when the dialog closes without saving.

#### Scenario: Preview and save display formats
- **WHEN** a user edits formats and saves the Display tab
- **THEN** every preview updates before Save and all four persisted formats change in one organization mutation

#### Scenario: Cancel display changes
- **WHEN** a user edits a format and closes the dialog without saving
- **THEN** no display format or organization revision changes

#### Scenario: Inspect the Display layout
- **WHEN** the Employee model opens either top-level tab
- **THEN** Model and Display show thematic accessible icons and each Display section has no enclosing fill, rounding, or padding while its preview retains its boundary and card spacing

### Requirement: Employee display formats use contextual template values
Each format MUST use the existing `@`, `{token}`, and conditional grammar and offer built-in
Employee fields, contextual Unit fields, Tags, and every custom field while excluding avatar data.
Ordinary array values SHALL join with `; ` and Composite values SHALL use their existing
deterministic text serialization. `{tags}` MUST retain ordered Tag objects and `{position}` MUST
retain ordered contextual positions as semantic display groups. Employees and fallback cards MUST
aggregate every system-View assignment in structural order and treat `isBoss` as true when any
assignment is managed. Units, Editor, and PNG rows MUST resolve Unit fields from the one containing
Unit.

#### Scenario: Render one Employee in different contexts
- **WHEN** one Employee belongs to multiple system Units and appears inside one selected Unit
- **THEN** Employees renders ordered badges for every populated position while the Units card and drag preview use only the selected Unit position

#### Scenario: Preview a format
- **WHEN** Display opens with a non-empty catalog
- **THEN** list previews use the first suitable system-View Employee and Editor previews use the first suitable active-View Employee

#### Scenario: Preview without Employees
- **WHEN** Display opens with an empty Employee catalog
- **THEN** all previews render a transient synthetic example without persisting it

### Requirement: Employee cards render configured information columns
Employee cards SHALL render each non-empty format line as inline Markdown containing ordinary text,
bold, italic, strike, inline code, safe links, native Tag chips, and neutral position badges. Every
line in one context SHALL use the same base size, color, and normal weight; Markdown alone controls
emphasis. Text SHALL truncate horizontally while semantic Tag and position groups MAY wrap complete
chips. Avatar, boss marker, card actions, search highlighting, safe explicit profile, email,
Markdown and Unit navigation, and the full-name accessible label MUST remain available independently
of formatted content. Explicit safe Markdown links SHALL override automatic field navigation.

#### Scenario: Use the Employees fallback format
- **WHEN** an Employee card is outside Employees, Units, Editor canvas, and Editor PNG contexts
- **THEN** it renders the Employees-section rich format

#### Scenario: Render an empty format
- **WHEN** the applicable saved format produces no visible text, Tags, or positions
- **THEN** the information column is empty while the avatar, accessible name, and actions remain usable

#### Scenario: Preserve native fields
- **WHEN** a format contains `{tags}` and `{position}` with Markdown text before or after them
- **THEN** Tags retain catalog colors and localized dates, positions retain neutral badge styling, and adjacent text retains its Markdown marks

#### Scenario: Keep values inert
- **WHEN** an Employee or custom field value contains Markdown punctuation or HTML
- **THEN** that value renders verbatim without creating formatting, embedded content, or a request

## ADDED Requirements

### Requirement: Display formats provide selection Markdown tools
The four Employee Display format inputs SHALL show an accessible anchored menu for a non-empty text
selection with Bold, Italic, Strikethrough, Inline code, and Link actions. Formatting actions MUST
toggle the corresponding delimiter, preserve or restore the edited selection, and leave the input
usable. The selection menu and token suggestion menu MUST be mutually exclusive and Escape or an
outside click MUST dismiss the menu without changing the draft.

#### Scenario: Format selected text
- **WHEN** a user selects format text and activates a Markdown mark
- **THEN** the selected range is wrapped or unwrapped with the corresponding syntax and remains selected

#### Scenario: Use token suggestions after formatting
- **WHEN** the selection menu closes and the user types an `@` query at a collapsed caret
- **THEN** ordinary token suggestions open and insert the selected token without a second overlay

### Requirement: Display format links are edited safely
The Link selection action SHALL create a transient URL editor for new selected text and SHALL detect
an existing Markdown link for address changes or removal. Apply MUST accept only `http:`, `https:`,
`mailto:`, or `tel:` destinations and MUST leave the draft unchanged with localized validation for
any other value. Removing a link MUST preserve its label text.

#### Scenario: Create and edit a link
- **WHEN** a user applies a safe URL to selected text and later selects its label
- **THEN** the format contains one Markdown link whose address can be changed without changing the label

#### Scenario: Remove a link
- **WHEN** the existing-link editor invokes Remove
- **THEN** only the link syntax and destination are removed while its label remains selected

#### Scenario: Reject an unsafe link
- **WHEN** Link Apply receives an invalid or unsupported destination
- **THEN** localized feedback remains in the transient editor and the format draft is unchanged
