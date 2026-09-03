## ADDED Requirements

### Requirement: Complete State requires distribution View UI
Every View UI entry in the strict current State SHALL contain a unique
`distributionModeUnitIds` array whose IDs belong to that View. Complete State Import SHALL reject a
missing, duplicate, or foreign Unit ID atomically; complete State Export SHALL preserve valid mode
settings.

#### Scenario: Transfer enabled Units
- **WHEN** a valid complete State with enabled distribution Units is exported and imported
- **THEN** every View restores its own enabled Unit IDs

#### Scenario: Import the former View UI shape
- **WHEN** complete State omits `distributionModeUnitIds`
- **THEN** validation rejects it without changing the current state
