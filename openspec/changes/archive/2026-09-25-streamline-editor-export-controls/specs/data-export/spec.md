## MODIFIED Requirements

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

JSON SHALL include every exact Unit assignment and one object per Employee. Template output SHALL
evaluate every retained Employee Unit assignment in stable structure order and SHALL retain one
fallback row for a directly selected Employee without a retained Unit. Searchable virtualized
exclusion controls SHALL omit exact Unit IDs and normalized Tag labels without removing the Employee
or implicitly excluding descendant Units. `unitFullPath` SHALL use the fixed ` / ` separator.
Template output SHALL retain Employee, Unit, tag, and dated-tag tokens. CSV output and a configurable
Unit-path separator SHALL NOT be available.

Preview output SHALL be bounded to 50 records or processed text lines and 128 KiB. Complete output
SHALL be built only for an explicit Copy or Download action, SHALL remain local, and SHALL NOT enter
browser storage. Successful downloads SHALL not render a downloaded-file label, while clipboard
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

#### Scenario: JSON retains every assignment
- **WHEN** an Employee belongs to multiple retained Units and JSON is generated
- **THEN** one Employee object contains all retained Unit objects

#### Scenario: Generate a template for every assignment
- **WHEN** an Employee belongs to multiple retained Units and either Template surface generates output
- **THEN** the formatter evaluates every Unit context in stable structure order without a row-mode control

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

### Requirement: Template output can remove empty lines consistently
Data Download and Editor Template export SHALL expose shared **Keep only unique values** and
**Remove empty lines** checkboxes in that order. Both options SHALL default off and remain transient
to the open export surface. When empty-line removal is enabled, processing SHALL first remove every
whitespace-only rendered line. When uniqueness is enabled, processing SHALL then retain the first
exact occurrence of each remaining rendered line with case and whitespace significant. Processing
SHALL recognize LF, CRLF, and CR input boundaries, join retained output with LF, and SHALL NOT add a
terminal line. Preview, Copy, Download, and every visible Template count SHALL consume the same
processed line stream. Neither option SHALL affect JSON, Image, organization State, browser storage,
or network behavior.

#### Scenario: Keep exact unique lines
- **WHEN** uniqueness is enabled and rendered lines contain exact duplicates plus values that differ by case or whitespace
- **THEN** only later exact duplicates are removed while the first occurrence and all distinct values keep their original order and content

#### Scenario: Combine line filters
- **WHEN** both options are enabled and Template evaluation produces whitespace-only and duplicate nonempty lines across Employee batches
- **THEN** whitespace-only lines are removed first and duplicate nonempty lines remain removed across every batch boundary

#### Scenario: Preserve unprocessed output
- **WHEN** both options are disabled
- **THEN** preview, copied text, and downloaded text retain the existing rendered Template output byte for byte

#### Scenario: Count processed output
- **WHEN** either option or Template Format changes
- **THEN** every visible Template count updates from the same processed output used by preview, Copy, and Download

#### Scenario: Bound processed preview work
- **WHEN** Template export contains 20,000 Employees with either line option enabled
- **THEN** complete counts are derived in linear work without constructing complete preview text and displayed output remains bounded to 50 processed lines and 128 KiB

## ADDED Requirements

### Requirement: Editor PNG uses fixed high-quality local settings
Scoped and full-View Editor Image export SHALL request 3x output for Copy and Save while retaining
the 32-megapixel and 16,384-pixel side safety limits. Preview SHALL request the same density while
retaining its 8-megapixel bound. Neither dialog SHALL expose density, output font, title, title size,
or title alignment. Standard Unit and Employee content SHALL use the local system UI font while
durable Text and Sticker elements retain their own stored typography. Transparent and gradient
backgrounds SHALL remain available. Solid backgrounds SHALL use the shared local color dropdown
with presets, organization-used colors, custom values, and alpha, and SHALL NOT expose a no-color
choice.

#### Scenario: Save at fixed density
- **WHEN** a user copies or saves an image whose 3x dimensions fit the Canvas limits
- **THEN** the PNG uses exactly 3x density without a density control

#### Scenario: Clamp a large image
- **WHEN** a 3x preview, Copy, or Save would exceed its pixel or side limit
- **THEN** the renderer reduces effective density silently and still creates the bounded image

#### Scenario: Use simplified image settings
- **WHEN** either image dialog opens
- **THEN** title and output-font controls are absent while padding, Unit radius, Employee format, background, preview, Copy, and Save remain available

#### Scenario: Choose a solid organization color
- **WHEN** a user selects a preset, already-used, custom, or alpha color from the shared background dropdown
- **THEN** preview, Copy, and Save paint its resolved local Canvas color without a remote request
