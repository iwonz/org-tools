## ADDED Requirements

### Requirement: Validation covers Tag-filter bulk selection
Repository validation SHALL cover complete Tag selection, complete deselection, disabled states,
Without tags independence, shared filter consumers, six locales, RTL, large virtualized catalogs,
both runtimes, and browser diagnostics. The maintained deterministic gallery SHALL remain exactly 56
PNGs and update its existing Employee-filter frame without adding a scenario.

#### Scenario: Validate shared filter consumers
- **WHEN** browser coverage exercises Tag filters in ordinary and Live Unit workflows
- **THEN** the same bulk controls and one-update semantics work without console, page, resource, or network diagnostics

#### Scenario: Regenerate the gallery
- **WHEN** screenshot generation runs twice from unchanged source and fixtures
- **THEN** all 56 hashes match and the existing Employee-filter frame shows the bulk Tag actions
