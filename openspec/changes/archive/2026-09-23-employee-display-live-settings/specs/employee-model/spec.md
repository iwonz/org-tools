## MODIFIED Requirements

### Requirement: Employee model owns card display formats
The Employee model SHALL retain field configuration under an icon-labeled Model tab and expose an
icon-labeled Display tab containing flat Employees section, Units section, Editor card, and Editor
export card format sections. Each format SHALL use the shared token input with inline Markdown tools,
a 0-24 pixel integer number input for line spacing, a localized Reset text action, and a bordered
live destination preview. Every valid format or gap change MUST update the corresponding stored value
immediately. Closing the dialog MUST retain accepted Display changes, and the Display tab MUST NOT
offer a separate Save action. Model-tab custom-field drafts MUST retain their existing explicit Save
workflow. New organizations MUST initialize Employees and Units formats with `{fullName}`,
`{username}`, `{email}`, `{positions}`, and `{tags}` on separate lines and MUST initialize every line
gap to 4 pixels.

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
- **THEN** only that format becomes the current locale's maintained default while its line gap and every other section remain unchanged

#### Scenario: Inspect the Display layout
- **WHEN** the Employee model opens either top-level tab
- **THEN** Model and Display show thematic accessible icons and each Display section has no enclosing fill, rounding, or padding while its preview retains its boundary and card spacing

#### Scenario: Create a new organization
- **WHEN** blank State is created in a supported locale
- **THEN** Employees and Units use `{positions}`, all line gaps equal 4, and Editor export contains that locale's Manager literal inside an `isBoss` ternary

### Requirement: Employee cards render configured information columns
Employee cards SHALL render authored format lines as inline Markdown containing ordinary text,
bold, italic, strike, inline code, safe links, native Tag surfaces, and native compound assignment
surfaces. Internal source-authored blank lines between visible content SHALL reserve one empty row;
leading and trailing blank lines and lines emptied only by absent values or false conditions SHALL
be omitted. Ordinary text MUST wrap by words to the available width with grapheme fallback for an
oversized uninterrupted value. Every line in one context SHALL use the same base size, color, and
normal weight; Markdown alone controls text emphasis.

The selected pixel gap SHALL exist only between adjacent visible visual rows, including authored
blank rows and rows created by automatic wrapping. It MUST add no space before the first row or
after the last row and MUST have no effect on the height of a single row. Total content height MUST
equal the sum of visual-row heights plus the gap multiplied by one less than the visible row count.
Text, Tags, and assignments MUST participate in one inline flow without a semantic token forcing a
new row. A long semantic surface SHALL split into content-sized decorated line fragments; every
fragment MUST retain the logical surface's padding, radius, color, and applicable border without
painting unused width after its content. Assignment fragments MUST retain emphasized position text,
a middle dot, and secondary Unit text. Avatar, boss marker, card actions, search highlighting, safe
explicit Markdown navigation, and the full-name accessible label MUST remain available independently
of formatted content.

Every ordinary token, including `{position}`, `{unitName}`, `{fullName}`, `{profileUrl}`, `{email}`,
and custom fields, MUST render as text without implicit navigation. `{positions}` MUST retain its
native assignment surface, with only its Unit-name segment eligible for implicit navigation. That
Unit segment MUST navigate only in cards belonging to the Employees and Units sections. It MUST be
inert in Editor, PNG, Analytics, Calendar, catalogs, pickers, drag previews, and every other fallback
card. Explicit safe Markdown links MUST remain interactive in interactive list cards and visually
styled but inert in Editor and PNG.

#### Scenario: Use the Employees fallback format
- **WHEN** an Employee card is outside Employees, Units, Editor canvas, and Editor PNG contexts
- **THEN** it renders the Employees format and Employees line gap with any `{positions}` Unit segment inert

#### Scenario: Preserve authored rows
- **WHEN** visible format lines contain an internal blank line and long text exceeding card width
- **THEN** the blank row remains, the text wraps by words or graphemes, and configured gaps appear only between the resulting visual rows

#### Scenario: Space one visual row
- **WHEN** a resolved card contains exactly one visual row at line gaps 0, 4, and 24
- **THEN** its information-column height is identical at every gap

#### Scenario: Space several visual rows
- **WHEN** a resolved card contains multiple explicit, empty, wrapped, Tag, or assignment rows
- **THEN** its height equals the sum of row heights plus one configured gap between each adjacent pair and no outer gap

#### Scenario: Drop dynamic empty rows
- **WHEN** a complete source line contains only an absent field or a false conditional branch
- **THEN** that line contributes no visible row or spacing

#### Scenario: Render an empty format
- **WHEN** the applicable saved format produces no visible text, Tags, assignments, or internal blank row between content
- **THEN** the information column is empty while the avatar, accessible name, and actions remain usable

#### Scenario: Render ordinary tokens without links
- **WHEN** a format contains `{position}`, `{unitName}`, `{fullName}`, `{profileUrl}`, `{email}`, or a custom token outside Markdown link syntax
- **THEN** each resolved value is ordinary text with no navigation target

#### Scenario: Render an explicit Markdown link
- **WHEN** an interactive list-card format contains an ordinary token inside a safe Markdown link
- **THEN** explicit activation follows that validated destination with the maintained navigation protections

#### Scenario: Navigate one native position Unit
- **WHEN** an Employees or Units card renders `{positions}` and a user activates its Unit-name segment
- **THEN** the application opens that corresponding Unit while its position and middle dot remain noninteractive

#### Scenario: Keep native position Units inert elsewhere
- **WHEN** `{positions}` renders in Editor, PNG, Analytics, Calendar, a catalog, picker, drag preview, or fallback card
- **THEN** its complete native surface has no navigation target

#### Scenario: Keep values inert
- **WHEN** an Employee or custom field value contains Markdown punctuation or HTML
- **THEN** that value renders verbatim without creating formatting, embedded content, or a request

#### Scenario: Preserve inline native fields
- **WHEN** a format contains Markdown text before and after `{tags}` or `{positions}`
- **THEN** every value shares the available row, wrapping only when its measured fragments no longer fit

#### Scenario: Wrap one long Tag
- **WHEN** one Tag label is wider than the information column
- **THEN** every grapheme remains visible in content-sized decorated fragments without a full-width trailing fill
