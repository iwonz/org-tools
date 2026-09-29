## ADDED Requirements

### Requirement: Expanded empty Units contain their empty-state content

An expanded Editor Unit without visible Employee or Staffing Slot rows SHALL reserve enough shared body geometry for its complete padded empty-state content. The minimum height SHALL equal the shared header height plus vertical content padding plus the tallest empty-state child. Manual Edit Unit actions and Live no-match messages MUST remain within the Unit border at every supported zoom. Collapsed empty Units SHALL retain the header-only height. DOM layout, hierarchy placement, bounds, hit testing, anchors, and full-View or scoped PNG SHALL consume the same corrected Unit height, while transient empty-state controls MUST remain absent from PNG.

#### Scenario: Render an empty manual Unit
- **WHEN** an expanded manual Unit has no Employees or Staffing Slots
- **THEN** its complete Edit Unit action remains inside the card and the Unit height is 136 logical pixels before any Tag footer

#### Scenario: Render an empty Live Unit
- **WHEN** an expanded Live Unit has no matching Employees and no Staffing Slots
- **THEN** its localized no-match message remains inside the same reserved body area

#### Scenario: Collapse an empty Unit
- **WHEN** an empty Unit is collapsed
- **THEN** it keeps the 88-logical-pixel header-only height without an empty-state body

#### Scenario: Export empty Unit geometry
- **WHEN** an expanded empty Unit is included in a full-View or scoped PNG
- **THEN** its card bounds, hierarchy spacing, connections, and anchors match the DOM while the Edit Unit action or Live message is omitted
