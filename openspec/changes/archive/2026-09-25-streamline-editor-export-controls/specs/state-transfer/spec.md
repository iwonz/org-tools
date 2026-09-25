## MODIFIED Requirements

### Requirement: State transfer uses only the strict View state
Full State Import and Export SHALL contain every View document, global Employee catalog, four
Employee display formats, four bounded Employee display line gaps, and bounded per-View UI record in
the current strict contract. The Download projection MUST NOT contain the obsolete Template row
mode or transient line-processing settings. A previous State with `ui.download.rowMode`, without the
exact line-gap object, or with a former single structure SHALL be rejected atomically. Employee array
Import with Teams SHALL create or update assignments only in the system View.

#### Scenario: Round-trip Views and Employee display settings
- **WHEN** a valid current State containing custom Views and non-default Employee line gaps is exported and imported
- **THEN** View isolation, global catalogs, all Employee display settings, active View, per-View viewport, selection, distribution mode, and Download source restore exactly

#### Scenario: Reject obsolete Download state
- **WHEN** State Import receives an otherwise valid document containing `ui.download.rowMode`
- **THEN** the confirmation cannot apply and memory, SQLite, and live tabs remain unchanged

#### Scenario: Reject obsolete State
- **WHEN** State Import receives `organization.structure` or omits any required Employee line-gap key
- **THEN** the confirmation cannot apply and memory and SQLite remain unchanged

#### Scenario: Import Employee Teams
- **WHEN** mapped Employee Import creates or updates Team assignments
- **THEN** only the system View changes and custom Views plus Employee display settings remain byte-equivalent

#### Scenario: Round-trip Views
- **WHEN** a valid current State containing custom Views is exported and imported
- **THEN** View isolation, global catalogs, active View, per-View viewport, selection, distribution
  mode, and Download source restore exactly

#### Scenario: Reject single-structure State
- **WHEN** State Import receives `organization.structure` without the current View array
- **THEN** the confirmation cannot apply and memory and SQLite remain unchanged
