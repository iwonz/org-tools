## ADDED Requirements

### Requirement: State transfer uses only the strict View state
Full State Import and Export SHALL contain every View document and bounded per-View UI record in the
current strict contract. A previous single-structure state SHALL be rejected atomically. Employee
array Import with Teams SHALL create or update assignments only in the system View.

#### Scenario: Round-trip Views
- **WHEN** a valid current State containing custom Views is exported and imported
- **THEN** View isolation, global catalogs, active View, per-View viewport/selection, and Download source restore exactly

#### Scenario: Reject single-structure State
- **WHEN** State Import receives `organization.structure` without the current View array
- **THEN** the confirmation cannot apply and memory and SQLite remain unchanged

#### Scenario: Import Employee Teams
- **WHEN** mapped Employee Import creates or updates Team assignments
- **THEN** only the system View changes and custom Views remain byte-equivalent
