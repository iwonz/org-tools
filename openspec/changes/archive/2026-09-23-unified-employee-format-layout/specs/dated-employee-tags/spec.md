## MODIFIED Requirements

### Requirement: Dated tags are visible without changing label semantics
The application SHALL display every assigned Tag without caps, truncation, or overflow counters;
wrap long labels by words and then grapheme clusters; render dates as `label · localized date` with
a full-date tooltip; and keep searching and Live filtering based only on the label, identity based
on catalog ID, and ordering based on the global catalog. Every wrapped visual fragment SHALL use the
same density metrics and Tag color while sizing its decoration to its own content.

#### Scenario: Wrap all tags
- **WHEN** an Employee has more Tags than fit on one row in a card, list, dialog, control, or the Org Editor
- **THEN** every Tag and every label grapheme remains visible on later rows without a `+N` indicator or unused full-row fill

#### Scenario: Mixed bulk dates
- **WHEN** selected Employees carry one label with different dates
- **THEN** the bulk surface shows localized `label · Mixed dates` content and permits a shared set or clear action

#### Scenario: Search a dated tag
- **WHEN** an Employee has a dated Tag and the user searches or filters by its label
- **THEN** the Employee matches exactly as an undated assignment of the same label would

