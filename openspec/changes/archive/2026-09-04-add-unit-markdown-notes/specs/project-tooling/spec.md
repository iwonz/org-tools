## ADDED Requirements

### Requirement: Validation and gallery cover Unit Markdown notes
Repository validation SHALL cover strict Unit note state, View-local history and copying, safe
Markdown, both runtime persistence paths, localization, accessibility, and browser diagnostics. The
deterministic gallery SHALL contain exactly 54 PNGs by adding Unit note Preview and Editor scenarios
while the README retains its ten featured frames.

#### Scenario: Generate Unit note frames
- **WHEN** screenshot generation runs twice from unchanged source and fixtures
- **THEN** all 54 PNGs have identical hashes and the two note frames show Preview and Editor with
  synthetic Markdown content

#### Scenario: Validate a large noted Editor
- **WHEN** performance coverage renders 20,000 Employees and 4,000 Units with closed notes
- **THEN** no note Markdown is parsed, no organization write occurs, and spatial canvas behavior
  remains bounded
