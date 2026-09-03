## ADDED Requirements

### Requirement: Gallery documents Employee schema, Tags, and Calendar
The deterministic gallery SHALL contain 46 PNG files: the maintained existing workflows refreshed
for UUIDs, Tag colors, sidebar order, and Calendar, plus supporting Employee filter, Template field,
Value field, Tag management, custom Employee value, and Import custom mapping scenarios. Every PNG
SHALL use synthetic data and appear identically across two generations.

#### Scenario: Regenerate the gallery
- **WHEN** screenshots are generated twice from the same clean production build
- **THEN** all 46 referenced PNG files exist and their SHA-256 manifests match

### Requirement: Large-model validation remains bounded
Automated checks SHALL exercise 20,000 Employees and 4,000 Units with identity, Tag, custom field,
Import, filter, and output indexes, and SHALL fail on organization serialization or complete-list
rendering caused only by UI interaction.

#### Scenario: Filter the large fixture
- **WHEN** a custom filter changes on the maintained fixture
- **THEN** indexed matching and virtualized options respond without rebuilding organization state
