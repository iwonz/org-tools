## MODIFIED Requirements

### Requirement: Documentation and automation are publication-ready
The repository SHALL include an English README with exactly ten deterministic featured screenshot
previews, a comprehensive grouped screenshot catalog, contributor and security guidance, license,
tests, specifications, detailed documentation, CI, and generated PNGs. The reviewed Russian catalog
SHALL be the only source file containing Cyrillic product copy. The public state contract SHALL be
unversioned, current-only, complete, and validated without discriminators, partial scopes, generic
mapping, legacy migration, project metadata, or compatibility readers.

#### Scenario: README visual showcase
- **WHEN** a visitor opens README
- **THEN** exactly one full-size Import, Export, theme, language, Teams, Employees, Editor, Analytics,
  Calendar, and Download preview is linked locally

#### Scenario: Complete visual capability catalog
- **WHEN** a visitor opens the detailed screenshot guide
- **THEN** the 43-frame gallery contains ten featured workflows and only currently visible supporting
  behavior, without project, file, Save, autosave, or obsolete conflict frames

#### Scenario: Continuous validation
- **WHEN** CI runs on a clean checkout
- **THEN** locale completeness, singleton repository/API, tab synchronization, automatic writes,
  frame-coalesced Editor interaction, complete state transfer, both builds, browser suites,
  screenshots, OpenSpec, and public-safety checks pass against isolated synthetic state

#### Scenario: Current-schema policy
- **WHEN** the public state interface changes
- **THEN** obsolete types, readers, migrations, fixtures, docs, and tests are removed in the same
  change rather than retained

#### Scenario: Screenshot generation
- **WHEN** screenshot generation runs against both production runtimes
- **THEN** it deterministically replaces exactly 43 declared PNGs, including ten featured frames

#### Scenario: Screenshot manifest consistency
- **WHEN** generation or publication checks inspect the gallery
- **THEN** identifiers and filenames are unique, featured and guide links match the manifest, and
  removed persistence images are absent

#### Scenario: Publication language scan
- **WHEN** public-safety checks scan tracked source and production output
- **THEN** Cyrillic outside the exact Russian catalog path fails validation

#### Scenario: Large Editor interaction validation
- **WHEN** automated performance coverage prepares 20,000 Employees and 4,000 Units
- **THEN** pan and Unit drag preview produce no durable writes before completion, one final logical
  write after completion, and no per-event full Unit visibility scan
