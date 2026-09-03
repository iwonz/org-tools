# data-export Specification

## Purpose
Define the local, generic structured-text and Editor image export boundary for Employees and Units.
## Requirements
### Requirement: Data export remains local and generic
The application SHALL export selected Employees as structured JSON or separator templates using
only the generic data model. JSON SHALL contain one object per selected Employee and SHALL expose
one ordered top-level list containing scalar Employee fields plus independently selectable and
nameable Unit and Tag collections. Users SHALL reorder every top-level item by drag and drop in both
Data Download and Editor export, and the generated object SHALL follow that exact order. Unit and Tag
collections SHALL render as ordinary rows in the same list rather than separate surfaced blocks.

The Unit collection SHALL expose configurable and reorderable `unitId`, `unitName`, `unitFullPath`,
`position`, and `isBoss` fields. The Tag collection SHALL expose configurable and reorderable `label`
and `date` fields and SHALL represent every retained tag as one object. Both collections SHALL
default to disabled, SHALL be omitted while disabled, and SHALL be empty arrays when enabled but
empty after filtering. The Unit and Tag parent controls SHALL derive unchecked, indeterminate, and
checked state from their nested selections. Activating an unchecked or indeterminate parent SHALL
select every nested field; activating a fully checked parent SHALL clear every nested field.
Top-level and nested output names MUST be non-empty and unique within their JSON object.

JSON SHALL include every exact Unit assignment independent of Template row mode. Searchable
virtualized exclusion controls SHALL omit exact Unit IDs and normalized Tag labels without removing
the Employee or implicitly excluding descendant Units. `unitFullPath` SHALL use the fixed ` / `
separator. Template output SHALL retain All Units/First Unit row behavior and Employee, Unit, tag,
and dated-tag tokens. Both export surfaces SHALL use one shared visual control for that Template row
behavior. CSV output and a configurable Unit-path separator SHALL NOT be available.

Preview output SHALL be bounded to 50 records or rows and 128 KiB. Complete output SHALL be built
only for an explicit Copy or Download action, SHALL remain local, and SHALL NOT enter browser
storage. Successful downloads SHALL not render a downloaded-file label, while clipboard
confirmation and localized errors SHALL remain available.

Editor PNG output SHALL receive the active locale, render every tag as `label` or
`label · localized date`, wrap complete chips, and expand Employee rows and Unit cards using the
same packing model as the live Editor.

#### Scenario: Employee field export
- **WHEN** a user selects gender, profile, embedded avatar, birthday, or contact fields
- **THEN** the exported value comes directly from the persisted Employee without deriving or inferring it from another identifier

#### Scenario: Reorder top-level JSON fields
- **WHEN** a user drags scalar, Unit, and Tag rows into a new order
- **THEN** both the bounded preview and complete JSON emit enabled keys in that exact order
- **AND** reopening durable Data Download restores the order

#### Scenario: Configure JSON collections
- **WHEN** a user enables Units or Tags, changes parent or child names, reorders nested fields, and selects nested fields
- **THEN** every Employee record contains the configured collection and object keys in deterministic selected order

#### Scenario: Toggle a collection parent
- **WHEN** no or some nested fields are selected and the user activates the parent
- **THEN** every nested field becomes selected
- **AND** activating the fully selected parent clears every nested selection and omits the collection

#### Scenario: Exclude exact assignments and tags
- **WHEN** a user excludes a Unit or Tag from JSON
- **THEN** matching exact assignments or normalized labels are omitted while the Employee, other assignments, and descendant Units remain

#### Scenario: JSON ignores Template row mode
- **WHEN** an Employee belongs to multiple retained Units and JSON is generated
- **THEN** one Employee object contains all retained Unit objects regardless of the saved Template row mode

#### Scenario: Generate a template
- **WHEN** the user selects All Units or First Unit through either export surface and generates Template output
- **THEN** the same shared control and formatter render the corresponding rows with the fixed Unit-path separator

#### Scenario: Preview a large output
- **WHEN** the selected sources contain 20,000 Employees
- **THEN** settings render a bounded preview without constructing the complete output
- **AND** searchable Unit and Tag exclusions render only visible option rows

#### Scenario: PNG with many dated tags
- **WHEN** an Employee has more localized dated tags than fit on one image row
- **THEN** the PNG contains every tag on wrapped rows and expands geometry without overlaps or an overflow count

#### Scenario: Local export
- **WHEN** a user copies or saves complete JSON, Template, or Editor image output
- **THEN** data is produced in the browser after the explicit action without upload, remote API, or browser persistence

#### Scenario: Silent file download
- **WHEN** a user downloads a file after copying or without a prior copy
- **THEN** no downloaded-file success label appears and any prior copy confirmation is cleared

### Requirement: Template formats use one token-aware input
Data Download, Editor Template export, and custom Employee Template definitions SHALL use one shared
multiline Format input and SHALL NOT render separate token-button catalogs. Every such input SHALL
place a compact focusable help icon immediately after its Format label. Hovering or focusing the
icon SHALL explain that typing `@` opens token suggestions, and the input placeholder SHALL provide
the same concise discovery cue. Typing `@` immediately before the caret SHALL open a caret-positioned
bordered suggestion menu containing the matching `{token}` and a localized short description.
Matching MUST be case-insensitive by substring across token keys and descriptions. Choosing a token
SHALL replace only the active `@query` with the existing `{token}` syntax and place the caret after
it. Manual `{token}` values and conditional expressions SHALL retain their existing formatter behavior.

#### Scenario: Discover token suggestions
- **WHEN** a user hovers or focuses the help icon beside any token-aware Format label
- **THEN** localized guidance explains that typing `@` opens token suggestions without changing the field value

#### Scenario: See the token placeholder
- **WHEN** a token-aware Format field is empty
- **THEN** its localized placeholder indicates that `@` can add tokens

#### Scenario: Insert a token with the keyboard
- **WHEN** a user types `@name`, changes the active suggestion with Arrow Up or Arrow Down, and presses Enter
- **THEN** the matching `{token}` replaces `@name`, focus remains in Format, and the caret follows the inserted token

#### Scenario: Insert a token with the pointer
- **WHEN** the suggestion menu is open and the user activates an option
- **THEN** the active `@query` is replaced without changing text outside that range

#### Scenario: Close without insertion
- **WHEN** the menu is open and the user presses Escape or Tab
- **THEN** the menu closes, no suggestion is inserted, and the Format value remains unchanged

#### Scenario: Preserve a literal at sign
- **WHEN** the user types whitespace after an active `@query`
- **THEN** the menu closes and the literal typed text remains unchanged

#### Scenario: Dismiss before deleting
- **WHEN** the menu is open and the user presses Backspace
- **THEN** the first press only closes the menu and a subsequent Backspace edits the Format value normally

### Requirement: Birthday output retains complete canonical data
Data Download and Editor JSON or Template export SHALL emit an Employee birthday directly as its
persisted canonical `DD.MM.YYYY` value or null. They MUST NOT drop the known year, convert the value
to another date order, or replace the unknown-year sentinel.

#### Scenario: Export a known birthday
- **WHEN** birthday is selected for JSON or Template output and the Employee has a known year
- **THEN** output contains the exact canonical complete birthday

#### Scenario: Export an unknown-year birthday
- **WHEN** birthday is selected and its persisted year is `1900`
- **THEN** output contains the exact `DD.MM.1900` value without inferring a year

### Requirement: Structured output includes custom Employee fields
Data Download and Editor JSON SHALL expose every custom field as an ordinary selectable and sortable
top-level field. The default output name SHALL be its token key and MAY be overridden with the same
nonempty collision checks as built-in fields. Value fields SHALL preserve JSON types, option values
SHALL emit labels, unset values SHALL emit null, and Template fields SHALL emit rendered text or the
configured digest.

#### Scenario: Reorder custom JSON fields
- **WHEN** a user moves built-in, collection, and custom rows
- **THEN** preview and complete JSON follow the exact stored order without a separate custom block

#### Scenario: Export an option field
- **WHEN** a selected option Value field is set on an Employee
- **THEN** JSON emits the current option label rather than the internal option UUID

### Requirement: Template output resolves the custom token graph
Both Template surfaces SHALL include every valid custom key in the shared `@` suggestions and
conditional-expression resolver. Custom dependencies SHALL be evaluated once per Employee in
topological order and SHALL use the same values and hashes in Data Download and Editor export.

#### Scenario: Insert a custom token
- **WHEN** a user chooses a custom field from the `@` menu
- **THEN** the current key is inserted and both output surfaces resolve it identically

### Requirement: Editor PNG preserves Tag catalog colors
Editor PNG preview, copy, and download SHALL paint every Employee Tag with the catalog's neutral,
named, or canonical custom color as a restrained tonal fill and contrast-safe foreground. Alpha
colors SHALL resolve deterministically without DOM or network access. Color rendering MUST preserve
complete labels, localized dates, wrapping, row heights, Unit bounds, and connection geometry.

#### Scenario: Export named and custom Tag colors
- **WHEN** an exported roster contains neutral, named, six-digit, and alpha-bearing custom Tags
- **THEN** the PNG uses the corresponding readable Tag treatments instead of one shared gray fill

#### Scenario: Preserve wrapped colored Tags
- **WHEN** a colored Tag label wraps across multiple lines
- **THEN** its entire chip uses one color pair and existing measured layout remains aligned

### Requirement: Data Download selects an isolated View source
Data Download SHALL expose an independent View Select containing the system and every custom View.
Its Unit tree, assignments, positions, and available Employees SHALL come only from the selected
View, and the Employee source list SHALL contain only Employees assigned anywhere in that View.
Editor export SHALL use the active Editor View.

#### Scenario: Select a custom Download source
- **WHEN** the user selects a custom View in Data Download
- **THEN** Unit and Employee selection reflects only that View while global Employee fields and Tags remain current

#### Scenario: Change Download source
- **WHEN** a different source View is selected
- **THEN** source selections, Employee exclusions, Unit exclusions, and source-specific filters reset while output field, Template, and global Tag-exclusion settings remain

#### Scenario: Delete the Download source
- **WHEN** the selected custom View is deleted
- **THEN** Download falls back to the system View and performs the same source reset atomically

#### Scenario: Export the active Editor View
- **WHEN** Image, JSON, or Template export starts from an Editor Unit
- **THEN** its scope and assignments come only from the active View
