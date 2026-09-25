## ADDED Requirements

### Requirement: Analytics exposes custom and Composite fields safely
Analytics SHALL expose scalar Value fields, Template fields, multi-option labels, and selected Composite subfields through stable typed references. A custom field MUST NOT be deleted while a saved dataset, dimension, measure, predicate, sort, filter, or presentation binding references it.

#### Scenario: Query a Composite dataset
- **WHEN** a widget selects one Composite field as its dataset
- **THEN** each current record becomes one row with its typed subfields and owning Employee identity

#### Scenario: Delete an analytics-referenced field
- **WHEN** a user tries to delete a field referenced by a saved widget
- **THEN** deletion is blocked and the referencing dashboards and widgets are identified

