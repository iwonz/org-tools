# employee-model Specification

## Purpose
Define persisted Employee fields, Unit-scoped roles, and safe profile and avatar values.
## Requirements

### Requirement: Employees use generic persisted fields
The system SHALL persist a stable UUID, Employee identity, contact, profile, embedded avatar,
birthday, normalized gender, Tag assignments by catalog UUID, and typed custom values without
source-specific origins or remote photo fields. Gender SHALL be exactly `male`, `female`, or
`unspecified` and SHALL NOT be inferred from another value.

#### Scenario: Employee persistence
- **WHEN** an Employee is created, edited, saved, and reopened
- **THEN** its UUID, standard fields, Tag assignments, and custom values retain their values

#### Scenario: Invalid Employee identifier
- **WHEN** a strict Employee record contains a missing or non-canonical UUID
- **THEN** strict validation rejects the complete operation without changing organization state

#### Scenario: Invalid gender
- **WHEN** a strict Employee record contains a missing or unknown gender value
- **THEN** validation rejects the complete operation without changing organization state

### Requirement: Employee identity uses a stable UUID and a separate duplicate key
Every newly created Employee SHALL receive UUID v4. Imported new Employees SHALL retain a canonical
UUID. Duplicate detection SHALL use normalized first name, last name, and email with Unicode NFKC,
trimmed and collapsed whitespace, and locale-independent case-folding. Editing identity fields MUST
NOT change the UUID or relationship references.

#### Scenario: Edit Employee identity
- **WHEN** an identity edit has no normalized duplicate
- **THEN** the existing UUID and every Unit and UI reference remain unchanged

#### Scenario: Reject duplicate identity
- **WHEN** a create or edit matches another normalized identity tuple
- **THEN** the mutation is rejected atomically even though the UUID differs

### Requirement: Employee filters use complete ordered criteria
Every shared Employee filter, including Live Unit rules, SHALL render Unit, Tag, position, gender,
complete birthday, then custom fields. Birthday SHALL include day, month, and year and SHALL match
the exact canonical value, including `1900` for unknown year.

#### Scenario: Filter an exact birthday
- **WHEN** day, month, and year are selected
- **THEN** only Employees with that complete canonical birthday match

#### Scenario: Persist a Live Unit custom filter
- **WHEN** a Live Unit rule contains gender, complete birthday, or custom field selections
- **THEN** the strict state retains those selections and derived membership uses them

### Requirement: Shared Tag filters support bulk selection
Every shared Employee Tag filter, including Live Unit rules, SHALL expose a transient search field,
catalog option ordering, Select all and Deselect all actions, and the independent
Without tags option. Search SHALL match normalized Tag labels without case or diacritic sensitivity
and SHALL keep the option list virtualized. Select all SHALL add every currently visible Tag exactly
once while preserving selected Tags outside the query. Deselect all SHALL remove every currently
visible Tag while preserving selections outside the query. Both actions MUST leave Without tags
unchanged and MUST produce one logical filter update.

#### Scenario: Search a large Tag catalog
- **WHEN** the user enters part of a Tag label
- **THEN** the virtualized list shows matching Tags in catalog order without changing selection

#### Scenario: Select found Tags
- **WHEN** at least one visible Tag is not selected and the user activates Select all
- **THEN** every visible Tag becomes selected in one update while hidden selections and Without tags remain unchanged

#### Scenario: Deselect found Tags
- **WHEN** one or more visible Tags are selected and the user activates Deselect all
- **THEN** only visible Tag IDs are removed in one update while hidden selections and Without tags remain unchanged

#### Scenario: Use bulk actions without a query
- **WHEN** the search field is empty
- **THEN** Select all and Deselect all operate on the complete ordered Tag catalog rather than mounted rows

#### Scenario: Reopen the filter
- **WHEN** the filter popover closes and opens again
- **THEN** the transient Tag query is empty while persisted filter selections remain intact

### Requirement: Roles remain Unit-scoped
The system SHALL store position and boss status on Employee-to-Unit assignments rather than on the Employee card.

#### Scenario: Multiple positions
- **WHEN** one Employee is assigned to multiple Units
- **THEN** each assignment can retain an independent position and boss status

### Requirement: Profile and avatar values are safe
The system SHALL allow only HTTP(S) profile links and bounded PNG, JPEG, or WebP data URLs for avatars.

#### Scenario: Unsafe values
- **WHEN** imported or opened data contains an executable profile scheme or unsupported avatar data URL
- **THEN** validation rejects the affected operation without rendering or requesting the value

### Requirement: Employee avatars can be selected and cropped locally
The application SHALL accept an explicit local PNG, JPEG, or WebP file or image clipboard item,
present a 1:1 pan and zoom crop interface, and store only a validated 512 by 512 WebP or PNG data URL
in the Employee draft. WebP SHALL remain preferred, while a browser-selected or explicitly retried
PNG SHALL be accepted when local WebP canvas encoding is unavailable. Source decoding, preview
downscaling, crop encoding, and fallback encoding MUST remain local and bounded.

#### Scenario: Select and crop avatar with WebP support
- **WHEN** a supported image within the source byte and pixel limits is selected or pasted, the crop
  is confirmed, and the browser encodes WebP
- **THEN** the form preview uses the locally encoded 512 by 512 bounded WebP without a network request

#### Scenario: Crop avatar without WebP support
- **WHEN** WebP canvas encoding returns no blob or a safe PNG fallback for an otherwise valid crop
- **THEN** the application accepts or explicitly encodes a 512 by 512 bounded PNG without changing
  the crop or requiring another user action
- **AND** the form preview and subsequent Employee save succeed without a WebP-specific error

#### Scenario: Downscale a large source without WebP support
- **WHEN** a valid source exceeds the preview-dimension cap and WebP canvas encoding is unavailable
- **THEN** the bounded preview is prepared as a local PNG and remains available for crop selection

#### Scenario: Invalid avatar source or output
- **WHEN** the source type, byte size, decoded dimensions, clipboard permission, image decode, all
  local encoders, or final encoded size is invalid
- **THEN** the draft remains unchanged and an owned format-neutral localized error is shown

### Requirement: Existing avatars can be adjusted or removed
The application SHALL allow an existing saved avatar to be re-cropped from its current square,
replaced from file or clipboard, or cleared without persisting the original source image.

#### Scenario: Cancel avatar edit
- **WHEN** the crop dialog is canceled or the Employee form closes without saving
- **THEN** the persisted Employee avatar remains unchanged and temporary image resources are released

#### Scenario: Remove avatar
- **WHEN** the user clears an avatar and saves the Employee form
- **THEN** `avatarBase64Url` becomes null and the initials fallback is displayed

### Requirement: Employee birthdays use complete canonical dates
Every non-null Employee `birthday` SHALL be a zero-padded `DD.MM.YYYY` string containing a valid
Gregorian day, month, and year. Year `1900` SHALL be reserved to mean that only day and month are
known and MUST NOT be treated as a literal birth year. Known years SHALL be between 1901 and the
current year. The unknown-year sentinel SHALL validate day and month against a leap-capable
calendar so `29.02.1900` remains representable.

#### Scenario: Known complete birthday
- **WHEN** an Employee is saved with a valid selected day, month, and known year
- **THEN** the birthday persists as canonical `DD.MM.YYYY` and the year remains known

#### Scenario: Unknown birth year
- **WHEN** day and month are known but year is not
- **THEN** the birthday persists with year `1900` and consumers treat it as recurring day-and-month data

#### Scenario: Unknown-year leap day
- **WHEN** an Employee birthday is `29.02.1900`
- **THEN** strict validation accepts it while still treating the year as unknown

#### Scenario: Invalid birthday
- **WHEN** a birthday uses another shape, is incomplete, is impossible for its known year, or is in the future
- **THEN** the complete operation is rejected without changing Employee or organization state

### Requirement: Employee forms compose draft controls consistently
Employee create and edit forms SHALL represent Gender as a three-option native-radio segmented
control for Male, Female, and Not specified with one boundary, neutral internal dividers, keyboard
navigation, and tonal selection that does not change geometry. Birthday SHALL retain three
independent Day, Month, and Year Select values inside one compound boundary with internal dividers,
one focus treatment, and only outer corner radii. Changing month or year SHALL clear a now-impossible
day while preserving current `DD.MM.YYYY` and unknown-year `1900` semantics.

Tags SHALL use one shared picker whose closed trigger wraps every selected Tag chip without a `+N`
summary or separate selected list. A dated chip SHALL show its localized date after a middle dot.
The virtualized popover SHALL support search, create, checkbox selection, and an optional date per
row, while changing only the form draft until the form's Save succeeds. Unit assignments SHALL use
the single visible label `Units`, accessible name `Select Units`, and validation `Select at least one
Unit` in every Employee form mode.

#### Scenario: Choose gender with radio semantics
- **WHEN** a keyboard or pointer user chooses a Gender segment
- **THEN** exactly one native radio is selected and only its tonal fill changes within the stable shared boundary

#### Scenario: Enter a compound birthday
- **WHEN** a user chooses Day, Month, and Year
- **THEN** the three adjacent Selects expose one compound control and produce one valid canonical birthday or null

#### Scenario: Invalidate a selected birthday day
- **WHEN** a selected day does not exist after month or year changes
- **THEN** Day is cleared and no invalid birthday enters the draft

#### Scenario: Edit draft Tags
- **WHEN** a user searches, creates, selects, dates, or clears Tags before saving the Employee form
- **THEN** every current draft Tag is visible inside the wrapping trigger and organization state remains unchanged

#### Scenario: Save draft Tags
- **WHEN** the user saves a valid Employee form after editing Tags
- **THEN** the final draft Tags are committed together with the Employee and ordinary persistence runs once

#### Scenario: Use Unit terminology in Editor mode
- **WHEN** an Editor-originated Employee form renders or fails Unit validation
- **THEN** it uses only the generic localized Unit label, picker name, and validation message

### Requirement: Global Employee identity spans every View
Employee creation and core-field, custom-value, and Tag edits SHALL mutate one global Employee
catalog. Stable Employee UUID references SHALL be shared by every View and durable UI selection.
Identity field edits SHALL NOT change those UUIDs. Global deletion SHALL purge every View, while
Editor membership removal SHALL affect only the active View.

#### Scenario: Edit an Employee used by multiple Views
- **WHEN** an identity field changes for an Employee referenced by multiple Views
- **THEN** every View resolves the updated global profile through the same stable Employee UUID

#### Scenario: Edit View-local assignment fields
- **WHEN** the Editor form changes an Employee's Unit, position, or boss assignment in a custom View
- **THEN** global profile data is shared but those assignment changes remain inside the active View

#### Scenario: Edit Teams globally
- **WHEN** the Employee catalog form changes Teams
- **THEN** only assignments in the system View change

### Requirement: Employee model owns card display formats
The Employee model SHALL retain field configuration under an icon-labeled Model tab and expose an
icon-labeled Display tab containing flat Employees section, Units section, Editor card, and Editor
export card format sections. Each format SHALL use the shared token input with inline Markdown tools,
a 0-24 pixel integer number input for line spacing, a localized normal-weight Reset text action, and
a bordered live destination preview. Every valid format or gap change MUST update the corresponding
stored value immediately. Closing the dialog MUST retain accepted Display changes, and the Display
tab MUST NOT offer a separate Save action. Model-tab custom-field drafts MUST retain their existing
explicit Save workflow. New organizations MUST initialize Employees and Units formats with
`{fullName}`, `{username}`, `{email}`, `{positions}`, and `{tags}` on separate lines and MUST
initialize every line gap to 4 pixels.

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

### Requirement: Required switches use flat rows
Every Required switch row in Employee model SHALL have no surrounding surface fill, border-like
rounding, or extra horizontal and vertical padding while retaining accessible switch semantics.

#### Scenario: Toggle a flat Required switch
- **WHEN** a keyboard user focuses and activates Required
- **THEN** the checked value changes without a surrounding field surface or form submission

### Requirement: Display formats provide selection Markdown tools
The six visual Employee format inputs SHALL use the shared multiline token-aware control. The four
Employee Display format inputs and the scoped and full-View PNG Employee-format inputs SHALL show an accessible anchored menu for a
non-empty text selection with Bold, Italic, Strikethrough, Inline code, and Link actions. Formatting
actions MUST toggle the corresponding delimiter, preserve or restore the edited selection, and
leave the input usable. The selection menu and token suggestion menu MUST be mutually exclusive and
Escape or an outside click MUST dismiss the menu without changing the draft. Plain-text Template
export and custom Template field inputs SHALL remain multiline and token-aware without enabling or
interpreting Markdown.

#### Scenario: Use token suggestions after formatting
- **WHEN** the selection menu closes and the user types an `@` query at a collapsed caret
- **THEN** ordinary token suggestions open and insert the selected token without a second overlay

#### Scenario: Format selected visual text
- **WHEN** a user selects text in any Employee card or PNG format and activates a Markdown mark
- **THEN** the selected range is wrapped or unwrapped with the corresponding syntax and remains selected

#### Scenario: Keep text Template output plain
- **WHEN** a user edits Download, Editor Template export, or a custom Template field
- **THEN** the shared input preserves `@` suggestions and newlines without offering Markdown tools or changing text-output semantics

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
