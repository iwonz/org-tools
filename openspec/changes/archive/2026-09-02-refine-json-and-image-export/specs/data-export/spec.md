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
