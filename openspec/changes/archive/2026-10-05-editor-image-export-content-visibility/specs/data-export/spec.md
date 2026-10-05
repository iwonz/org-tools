## ADDED Requirements

### Requirement: Editor PNG exports provide persistent content visibility controls
Both full-View and scoped Editor PNG dialogs SHALL expose one shared searchable Tag selector and a
**Hide Staffing Slots** checkbox. Every Tag available in the selected export subject projection
MUST be selected by default unless the acting account has persisted its ID as excluded. The selector
MUST show selected and total counts, Tag color and label, individual checkboxes, and bulk select and
deselect actions that apply to the entire available catalog independently of the search query.

Preview, Copy, and Save MUST consume the same effective preferences. Changes SHALL apply
immediately, persist in the acting account profile, synchronize through account UI state, and remain
shared between both dialogs.

#### Scenario: Exclude individual Tags
- **WHEN** a user deselects one or more available Tags in either PNG dialog
- **THEN** Preview updates immediately and subsequent Copy and Save omit the same semantic Tag output
- **AND** reopening either dialog or reloading the authenticated application retains the exclusions

#### Scenario: Select or deselect the complete catalog
- **WHEN** a search query is active and the user activates Select all or Deselect all
- **THEN** the action applies to every Tag available in the selected export source rather than only the search matches

#### Scenario: Receive a new authorized Tag
- **WHEN** a Tag not present in persisted exclusions becomes available to the account
- **THEN** it is selected for image export by default

### Requirement: Image Tag visibility covers every semantic Tag surface
An excluded Tag SHALL be absent from Employee `{tags}` chips, built-in `{tagDates}` text, Staffing
Slot Tag chips, and Unit Tag-cloud chips and counts. Filtering MUST recompute wrapping, row heights,
footer heights, Unit bounds, hierarchy connections, anchors, and final image bounds. It MUST NOT
change Employees, Unit membership, Live resolution, grouping, or sorting. Arbitrary Canvas text and
resolved custom Template output SHALL remain ordinary text and MUST NOT be parsed for Tag labels.

#### Scenario: Remove Tags from mixed image content
- **WHEN** one excluded dated Tag appears on an Employee, a Staffing Slot, and a Unit Tag cloud
- **THEN** none of those semantic surfaces contains the Tag or its date/count suffix
- **AND** remaining content compacts without overlaps or reserved Tag space

#### Scenario: Exclude every Tag
- **WHEN** the available Tag catalog is fully deselected
- **THEN** the PNG retains the same authorized Employees and Units while every semantic Tag surface is empty

### Requirement: Image export can completely suppress Staffing Slots
When **Hide Staffing Slots** is enabled, the exporter SHALL omit every visible Staffing Slot row,
fallback or custom Slot name, placeholder avatar, Rose surface, dashed outline, Slot Tag, and direct
or descendant Slot-count fragment. It SHALL also omit canvas elements whose attachment dependency
reaches a hidden Slot and arrows that require a hidden endpoint. Unrelated free-standing, Unit, and
Employee content MUST remain. All image geometry MUST be recalculated from the filtered scene.

#### Scenario: Hide Slots in a hierarchy
- **WHEN** a hierarchy containing direct and descendant Staffing Slots is exported with suppression enabled
- **THEN** no Slot row or Slot-count label is painted and Unit summaries contain only nonzero Employee fragments
- **AND** Unit heights and hierarchy paths use the filtered rows

#### Scenario: Hide Slot-attached annotations
- **WHEN** a canvas attachment chain or Arrow endpoint depends on a suppressed Staffing Slot
- **THEN** that dependent scene content is absent while unrelated canvas elements remain
