## MODIFIED Requirements

### Requirement: Employee cards render configured information columns
Employee cards SHALL render authored format lines as inline Markdown containing ordinary text,
bold, italic, strike, inline code, safe links, native Tag surfaces, and native compound assignment
surfaces. Internal source-authored blank lines between visible content SHALL reserve one empty block;
leading and trailing blank lines and lines emptied only by absent values or false conditions SHALL
be omitted. Ordinary text MUST be measured with its actual target font, wrap by words with grapheme
fallback for an oversized uninterrupted value, and remain complete without fragment-level clipping.
Every line in one context SHALL use the same base size, color, and normal weight; Markdown alone
controls text emphasis.

Each resolved authored line MUST form one ordered format block. Adjacent format blocks MUST use the
selected format line gap, including the boundaries above and below complete `{tags}` and
`{positions}` blocks. No gap may appear before the first or after the last block, and one block MUST
receive no outer gap. Text, Tags, and assignments MUST participate in one inline flow within their
block without a semantic token forcing another block. A long semantic surface SHALL split into
content-sized decorated line fragments; every fragment MUST retain the logical surface's padding,
radius, color, and applicable border without painting unused width after its content. Assignment
fragments MUST retain emphasized position text, a middle dot, and secondary Unit text. A boundary
that continues the Tag or assignment collection inside its block MUST use the native 6 pixel
vertical gap, independent of the selected format line gap. Ordinary text-wrap boundaries inside a
block MUST use the selected format line gap. Avatar, boss marker, card actions, search highlighting,
safe explicit Markdown navigation, and the full-name accessible label MUST remain available
independently of formatted content.

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
- **THEN** the blank block remains, the text wraps by actual-font word or grapheme measurements, and the configured gap appears between adjacent blocks and ordinary text rows

#### Scenario: Preserve complete identity values
- **WHEN** a username, email, URL, or custom value contains narrow and wide glyphs and still fits the available row
- **THEN** every final glyph remains visible and the value is neither truncated nor clipped to an estimated fragment width

#### Scenario: Space one format block
- **WHEN** a resolved card contains exactly one format block at line gaps 0, 4, and 24
- **THEN** its outer information-column height is identical at every gap unless ordinary text inside that block wraps

#### Scenario: Space adjacent format blocks
- **WHEN** `{fullName}`, `{positions}`, and `{tags}` resolve on three authored lines
- **THEN** the selected format gap appears exactly once between each adjacent pair and no gap appears above or below the resulting stack

#### Scenario: Preserve native semantic wrapping
- **WHEN** Tags, dated suffixes, or assignments wrap to multiple rows inside one semantic block
- **THEN** their internal vertical and horizontal collection gaps remain 6 pixels regardless of the selected format line gap

#### Scenario: Drop dynamic empty rows
- **WHEN** a complete source line contains only an absent field or a false conditional branch
- **THEN** that line contributes no format block or spacing

#### Scenario: Render an empty format
- **WHEN** the applicable saved format produces no visible text, Tags, assignments, or internal blank row between content
- **THEN** the information column is empty while the avatar, accessible name, and actions remain usable

#### Scenario: Render ordinary tokens without links
- **WHEN** a format contains `{position}`, `{unitName}`, `{fullName}`, `{profileUrl}`, `{email}`, or a custom token outside Markdown link syntax
- **THEN** each resolved value is ordinary complete text with no navigation target

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
- **THEN** every value shares the available block row, wrapping only when its actual measured fragments no longer fit

#### Scenario: Wrap one long Tag
- **WHEN** one Tag label is wider than the information column
- **THEN** every grapheme remains visible in content-sized decorated fragments without a full-width trailing fill and continuation fragments retain the native collection gap
