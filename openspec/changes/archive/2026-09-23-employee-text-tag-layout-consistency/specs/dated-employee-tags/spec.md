## MODIFIED Requirements

### Requirement: Dated tags are visible without changing label semantics
The application SHALL display every assigned Tag without caps, truncation, or overflow counters;
wrap long labels by words and then grapheme clusters; render dates as `label · localized date` with
a full-date tooltip; and keep searching and Live filtering based only on the label, identity based
on catalog ID, and ordering based on the global catalog. Every Tag and wrapped visual fragment SHALL
use an 11 pixel font, 16 pixel line height, 8 pixel inline padding, 2 pixel block padding, 6 pixel
radius, and 6 pixel collection gaps. The date or count suffix MUST stay inside the logical Tag,
remain whole on the last fitting fragment or its own continuation fragment, and leave exactly the
shared 8 pixel padding after its measured content.

#### Scenario: Wrap all tags
- **WHEN** an Employee has more Tags than fit on one row in a card, list, dialog, control, or the Org Editor
- **THEN** every Tag and every label grapheme remains visible on later rows with 6 pixel gaps and without a `+N` indicator or unused full-row fill

#### Scenario: Move a fitting Tag to the next row
- **WHEN** a complete Tag fits an empty row but not the remaining width of the current row
- **THEN** the whole Tag starts the next row instead of leaving one or more orphaned graphemes on a continuation fragment

#### Scenario: Render a dated suffix
- **WHEN** one Tag renders a localized date after its label
- **THEN** the date stays inside the same logical decoration and its last fragment has exactly 8 pixels of trailing internal padding

#### Scenario: Render a counted suffix
- **WHEN** Calendar or a Unit footer appends a count to a Tag
- **THEN** the count uses the same Tag typography and decoration with exactly 8 pixels of trailing internal padding

#### Scenario: Mixed bulk dates
- **WHEN** selected Employees carry one label with different dates
- **THEN** the bulk surface shows localized `label · Mixed dates` content and permits a shared set or clear action

#### Scenario: Search a dated tag
- **WHEN** an Employee has a dated Tag and the user searches or filters by its label
- **THEN** the Employee matches exactly as an undated assignment of the same label would
