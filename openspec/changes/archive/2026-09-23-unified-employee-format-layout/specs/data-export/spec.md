## MODIFIED Requirements

### Requirement: Template formats use one token-aware input
All token-aware Format inputs SHALL use one shared multiline control. This includes Data Download,
Editor Template export, both Editor Image Employee formats, custom Employee Template definitions,
and the four Employee Display formats. These inputs SHALL NOT render separate token-button
catalogs. Every input SHALL expose localized `@` discovery,
caret-positioned case-insensitive suggestions, keyboard and pointer insertion, and preserved source
newlines. The six visual Employee formats SHALL additionally expose the shared Markdown selection
tools. Plain-text Template formats SHALL not expose or interpret Markdown.

#### Scenario: Discover token suggestions and conditions
- **WHEN** a user hovers or focuses the help icon beside any token-aware Format label
- **THEN** localized guidance explains `@` suggestions and the supported conditional form without changing the value

#### Scenario: Insert a token with the keyboard
- **WHEN** a user types an `@` query, selects a suggestion, and presses Enter
- **THEN** only that query becomes the existing `{token}` syntax and the caret follows it

#### Scenario: Preserve authored newlines
- **WHEN** a user presses Enter in any Format input
- **THEN** the newline remains in its visual or plain-text destination according to that format's semantics

#### Scenario: Edit either PNG format
- **WHEN** a user selects text in the scoped or full-View PNG Employee format
- **THEN** the same Markdown menu available in Employee Display formats is available without a token-button catalog

#### Scenario: Preserve a conditional format
- **WHEN** either PNG Employee format contains a valid conditional expression
- **THEN** preview, copied PNG, and saved PNG resolve it with the same formatter behavior

### Requirement: Editor PNG starts from the persisted Employee export format
Scoped and full-View Editor Image export SHALL initialize Employee content from the persisted Editor
export format. Each local Image format SHALL remain a transient override and SHALL support Employee,
Tag, contextual Unit, custom-field, and display-only `{positions}` tokens plus inline Markdown and
authored newlines. Both dialogs MUST use the same token builder and MUST exclude avatar data. PNG
painting MUST consume the same measured rich fragments, font marks, inert explicit safe-link
styling, Tag colors, compound assignment styling, wrapping, and row geometry as Editor cards while
applying explicit image settings independently. Plain `{email}` MUST paint as ordinary text.

#### Scenario: Open Editor Image export
- **WHEN** either Image export dialog opens
- **THEN** its Employee format equals the current persisted Editor-export format and no token-button catalog is present

#### Scenario: Override one export
- **WHEN** a user changes the Employee format inside an Image export dialog
- **THEN** preview, copy, and save use the local value without changing the persisted model format

#### Scenario: Paint rich Employee content
- **WHEN** an exported Employee format contains Markdown, adjacent text, colored dated Tags, and `{positions}`
- **THEN** preview, copied PNG, and saved PNG paint the shared inline fragments and dependent Unit geometry without an active link or remote request

#### Scenario: Paint email values
- **WHEN** an exported format contains plain `{email}` and an explicit Markdown `mailto:` link
- **THEN** both paint locally as text and only the explicit link receives inert link styling
