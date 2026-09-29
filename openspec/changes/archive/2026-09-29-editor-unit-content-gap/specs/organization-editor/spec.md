## MODIFIED Requirements

### Requirement: Unit headers report Employees and Staffing Slots separately

Every Editor Unit summary SHALL derive distinct direct and descendant Employee counts plus direct and descendant Staffing Slot counts. Each summary line MUST omit zero-valued fragments and its separator, and the complete line including its prefix MUST be absent when both values are zero. A Unit with children SHALL render the remaining total and in-Unit lines in that order; a leaf SHALL render its unprefixed direct line only when it is non-empty. The fixed 88-pixel header summary area SHALL bottom-align zero, one, or two visible lines so the final visible line always ends at the same coordinate and leaves exactly eight logical pixels before the following Employee, Staffing Slot, or empty-state block. Slots MUST NOT contribute to either Employee count.

#### Scenario: Summarize a parent Unit
- **WHEN** a parent has nonzero descendant totals but zero direct Employees and Slots
- **THEN** only the bottom-aligned Total line appears and the In Unit prefix, zero counts, and separator are absent

#### Scenario: Summarize one nonzero kind
- **WHEN** one summary scope contains only Employees or only Staffing Slots
- **THEN** it displays only the localized nonzero count without a leading or trailing separator

#### Scenario: Align one-line and two-line summaries
- **WHEN** one Unit renders one visible summary line and another renders two
- **THEN** the final line in both headers has the same bottom coordinate and both content blocks begin after one eight-pixel interval

#### Scenario: Summarize an empty leaf
- **WHEN** a leaf has zero direct Employees and zero direct Staffing Slots
- **THEN** its fixed summary area remains empty without changing the header, row origin, Unit bounds, or anchors

### Requirement: Editor PNG reproduces Staffing Slots and Unit summaries

The Editor DOM and full-View or Unit/subtree PNG SHALL use the same Slot-first ordering, measured geometry, fallback names, placeholder avatars, translucent Rose surfaces, dashed outlines, complete Tag chips, collapse visibility, anchor resolution, zero-filtered bottom-aligned Unit summary lines, eight-pixel header-to-content interval, and compact Unit heights. Scoped PNG SHALL include canvas elements transitively attached to included Slots. Employee-format templates SHALL apply only to Employees, and transient interaction styling MUST NOT appear in PNG.

#### Scenario: Export a mixed hierarchy
- **WHEN** a hierarchy containing Employees, Staffing Slots, one-line or two-line summaries, and zero or nonzero summary values is exported
- **THEN** DOM and PNG contain matching row order, Slot surfaces, summary text positions, eight-pixel content intervals, bounds, and attachments while Employee-only counts remain distinct

### Requirement: Expanded empty Units contain their empty-state content

An expanded Editor Unit without visible Employee or Staffing Slot rows SHALL reserve enough shared body geometry for its complete empty-state content and one eight-pixel bottom inset. The minimum height SHALL equal the shared 88-pixel header height plus the tallest 32-pixel empty-state child plus the eight-pixel body bottom padding. Manual Edit Unit actions and Live no-match messages MUST remain within the Unit border at every supported zoom. Collapsed empty Units SHALL retain the header-only height. DOM layout, hierarchy placement, bounds, hit testing, anchors, and full-View or scoped PNG SHALL consume the same corrected Unit height, while transient empty-state controls MUST remain absent from PNG.

#### Scenario: Render an empty manual Unit
- **WHEN** an expanded manual Unit has no Employees or Staffing Slots
- **THEN** its complete Edit Unit action remains inside the card and the Unit height is 128 logical pixels before any Tag footer

#### Scenario: Render an empty Live Unit
- **WHEN** an expanded Live Unit has no matching Employees and no Staffing Slots
- **THEN** its localized no-match message remains inside the same reserved body area

#### Scenario: Collapse an empty Unit
- **WHEN** an empty Unit is collapsed
- **THEN** it keeps the 88-logical-pixel header-only height without an empty-state body

#### Scenario: Export empty Unit geometry
- **WHEN** an expanded empty Unit is included in a full-View or scoped PNG
- **THEN** its 128-pixel card bounds, hierarchy spacing, connections, and anchors match the DOM while the Edit Unit action or Live message is omitted
