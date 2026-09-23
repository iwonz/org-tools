## MODIFIED Requirements

### Requirement: Employee cards render configured information columns
Employee cards SHALL render authored format lines as inline Markdown containing ordinary text,
bold, italic, strike, inline code, safe links, native Tag surfaces, and native compound assignment
surfaces. Internal source-authored blank lines between visible content SHALL reserve one empty row;
leading and trailing blank lines and lines emptied only by absent values or false conditions SHALL
be omitted. Ordinary text MUST wrap by words to the available width with grapheme fallback for an
oversized uninterrupted value. Every line in one context SHALL use the same base size, color, and
normal weight; Markdown alone controls text emphasis.

The selected pixel gap SHALL separate visual rows without trailing space after the final row. Text,
Tags, and assignments MUST participate in one inline flow without a semantic token forcing a new
row. A long semantic surface SHALL split into content-sized decorated line fragments; every
fragment MUST retain the logical surface's padding, radius, color, and applicable border without
painting unused width after its content. Assignment fragments MUST retain emphasized position text,
a middle dot, and secondary Unit text. Avatar, boss marker, card actions, search highlighting, safe
explicit profile, Markdown and Unit navigation, and the full-name accessible label MUST remain
available independently of formatted content. `{email}` MUST remain ordinary text unless an author
places it in an explicit safe Markdown link.

#### Scenario: Use the Employees fallback format
- **WHEN** an Employee card is outside Employees, Units, Editor canvas, and Editor PNG contexts
- **THEN** it renders the Employees format and Employees line gap

#### Scenario: Preserve authored rows
- **WHEN** visible format lines contain an internal blank line and long text exceeding card width
- **THEN** the blank row remains, the text wraps by words or graphemes, and only configured inter-row gaps are added

#### Scenario: Drop dynamic empty rows
- **WHEN** a complete source line contains only an absent field or a false conditional branch
- **THEN** that line contributes no visible row or spacing

#### Scenario: Render an empty format
- **WHEN** the applicable saved format produces no visible text, Tags, assignments, or internal blank row between content
- **THEN** the information column is empty while the avatar, accessible name, and actions remain usable

#### Scenario: Preserve inline native fields
- **WHEN** a format contains Markdown text before and after `{tags}` or `{positions}`
- **THEN** every value shares the available row, wrapping only when its measured fragments no longer fit

#### Scenario: Wrap one long Tag
- **WHEN** one Tag label is wider than the information column
- **THEN** every grapheme remains visible in content-sized decorated fragments without a full-width trailing fill

#### Scenario: Render plain and linked email
- **WHEN** one format contains `{email}` and another contains `[{email}](mailto:{email})`
- **THEN** the first value is ordinary text and the second is an explicit safe link in interactive list cards

#### Scenario: Keep values inert
- **WHEN** an Employee or custom field value contains Markdown punctuation or HTML
- **THEN** that value renders verbatim without creating formatting, embedded content, or a request

### Requirement: Display formats provide selection Markdown tools
The six visual Employee format inputs SHALL use the shared multiline token-aware control. The four
Employee Display format inputs and the scoped and full-View PNG Employee-format inputs SHALL show an accessible anchored menu for a
non-empty text selection with Bold, Italic, Strikethrough, Inline code, and Link actions. Formatting
actions MUST toggle the corresponding delimiter, preserve or restore the edited selection, and
leave the input usable. The selection menu and token suggestion menu MUST be mutually exclusive and
Escape or an outside click MUST dismiss the menu without changing the draft. Plain-text Template
export and custom Template field inputs SHALL remain multiline and token-aware without enabling or
interpreting Markdown.

#### Scenario: Format selected visual text
- **WHEN** a user selects text in any Employee card or PNG format and activates a Markdown mark
- **THEN** the selected range is wrapped or unwrapped with the corresponding syntax and remains selected

#### Scenario: Use token suggestions after formatting
- **WHEN** the selection menu closes and the user types an `@` query at a collapsed caret
- **THEN** ordinary token suggestions open and insert the selected token without a second overlay

#### Scenario: Keep text Template output plain
- **WHEN** a user edits Download, Editor Template export, or a custom Template field
- **THEN** the shared input preserves `@` suggestions and newlines without offering Markdown tools or changing text-output semantics
