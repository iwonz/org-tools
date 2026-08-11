## MODIFIED Requirements

### Requirement: Org Editor Employee geometry follows wrapped tags
The Org Editor SHALL compute Employee row heights from all rendered localized tag chips and SHALL
use shared prefix offsets for virtualization, hitboxes, selection, connectors, layout, and bounds.
The PNG renderer SHALL draw every localized tag as a compact neutral chip matching the on-screen
Employee-card treatment, including rounded geometry, typography, wrapping, and `label · date`
content, and SHALL use the same packing dimensions for drawing and row-height growth without hidden
tags or unused tag-row space.

#### Scenario: Tag rows change
- **WHEN** Employee tags or the active locale changes the packed chip rows
- **THEN** measurements are invalidated and every downstream canvas geometry consumer uses the updated offsets without overlap

#### Scenario: Large View virtualization
- **WHEN** a large View contains variable-height Employee rows
- **THEN** only visible rows render while hit testing and connector anchors remain aligned with their Employees

#### Scenario: Export Employee tags to PNG
- **WHEN** an Employee with dated or undated tags is included in an Org Editor PNG export
- **THEN** every tag appears as a wrapped neutral chip with card-consistent text, padding, radius, and compact row gaps
- **AND** dated tags use a localized date after a middle dot without bright blue styling or reserved empty rows
