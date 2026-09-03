## ADDED Requirements

### Requirement: Validation and gallery cover Editor distribution mode
Repository validation SHALL cover strict View UI state, manual and Live membership, bounded
derivation, context-switch accessibility, persisted highlighting, single-selection connections,
multi-selection suppression, collapsed fallbacks, output exclusion, localization, and browser
diagnostics. The deterministic gallery SHALL contain exactly 56 PNGs while README retains ten
featured frames.

#### Scenario: Generate distribution frames
- **WHEN** screenshot generation runs twice from unchanged source and fixtures
- **THEN** all 56 hashes match and supporting frames show status highlighting plus selected placement connections

#### Scenario: Validate the large Editor
- **WHEN** 20,000 Employees and 4,000 Units exercise distribution mode
- **THEN** selection and viewport changes do not rebuild membership indexes, scan all Units, or write organization state
