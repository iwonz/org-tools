## ADDED Requirements

### Requirement: Birthday output retains complete canonical data
Data Download and Editor JSON or Template export SHALL emit an Employee birthday directly as its
persisted canonical `DD.MM.YYYY` value or null. They MUST NOT drop the known year, convert the value
to another date order, or replace the unknown-year sentinel.

#### Scenario: Export a known birthday
- **WHEN** birthday is selected for JSON or Template output and the Employee has a known year
- **THEN** output contains the exact canonical complete birthday

#### Scenario: Export an unknown-year birthday
- **WHEN** birthday is selected and its persisted year is `1900`
- **THEN** output contains the exact `DD.MM.1900` value without inferring a year
