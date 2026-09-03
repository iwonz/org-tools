## ADDED Requirements

### Requirement: Distribution analysis remains local
Distribution indexes, status, selection, and paths SHALL be derived only from the active in-memory
View and MUST NOT create network requests, telemetry, remote logging, browser snapshot storage, or
new report fields.

#### Scenario: Inspect distribution in Pages
- **WHEN** Pages highlights and connects an Employee's placements
- **THEN** the workflow completes in live-tab memory without an API or external request
