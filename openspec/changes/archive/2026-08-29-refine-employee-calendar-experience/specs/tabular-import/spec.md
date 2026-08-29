## ADDED Requirements

### Requirement: Ordinary Employee import normalizes gender
The ordinary JSON mapper SHALL expose Employee gender as an optional mapping target, SHALL normalize
recognized scalar values to `male`, `female`, or `unspecified`, and SHALL use
`unspecified` when the target is not mapped or the source value is empty.

#### Scenario: Mapped gender
- **WHEN** a valid ordinary Employee row maps a recognized gender value
- **THEN** the detached Employee draft contains the corresponding normalized gender enum

#### Scenario: Invalid mapped gender
- **WHEN** a mapped row contains an unsupported gender value
- **THEN** the preview owns the row error and the complete append remains unchanged

#### Scenario: Unmapped gender
- **WHEN** an ordinary Employee import does not map gender
- **THEN** every otherwise valid new Employee uses `unspecified`
