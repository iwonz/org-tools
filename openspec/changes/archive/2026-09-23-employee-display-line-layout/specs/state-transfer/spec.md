## MODIFIED Requirements

### Requirement: State transfer uses only the strict View state
Full State Import and Export SHALL contain every View document, global Employee catalog, four
Employee display formats, four bounded Employee display line gaps, and bounded per-View UI record in
the current strict contract. A previous State without the exact line-gap object or with a former
single structure SHALL be rejected atomically. Employee array Import with Teams SHALL create or
update assignments only in the system View.

#### Scenario: Round-trip Views and Employee display settings
- **WHEN** a valid current State containing custom Views and non-default Employee line gaps is exported and imported
- **THEN** View isolation, global catalogs, all Employee display settings, active View, per-View viewport, selection, distribution mode, and Download source restore exactly

#### Scenario: Reject obsolete State
- **WHEN** State Import receives `organization.structure` or omits any required Employee line-gap key
- **THEN** the confirmation cannot apply and memory and SQLite remain unchanged

#### Scenario: Import Employee Teams
- **WHEN** mapped Employee Import creates or updates Team assignments
- **THEN** only the system View changes and custom Views plus Employee display settings remain byte-equivalent
