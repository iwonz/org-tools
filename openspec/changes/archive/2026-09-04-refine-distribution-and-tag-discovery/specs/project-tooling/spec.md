## ADDED Requirements

### Requirement: Validation covers bulk distribution and Tag discovery
Repository validation SHALL cover single, all, and mixed distribution selections, one bounded UI
update, multi-placement row actions, read-only map navigation, searchable locale-aware Tag options,
search-scoped bulk selection, inline catalog counts, both runtimes, six locales, RTL, browser
diagnostics, and maintained large-model limits. The deterministic gallery SHALL contain exactly 58
PNGs while README retains ten featured frames.

#### Scenario: Validate both runtimes
- **WHEN** browser coverage exercises the workflows in server and Pages applications
- **THEN** behavior matches without console, page, resource, or unexpected network diagnostics

#### Scenario: Validate the large model
- **WHEN** 20,000 Employees and 4,000 Units exercise the placement map and Tag filters
- **THEN** viewport and selection do not rebuild membership indexes, the map reads only one Employee's placements, and Tag rows remain virtualized

#### Scenario: Regenerate the gallery
- **WHEN** screenshot generation runs twice from unchanged source and fixtures
- **THEN** all 58 hashes match and supporting frames show bulk distribution plus Employee placement navigation
