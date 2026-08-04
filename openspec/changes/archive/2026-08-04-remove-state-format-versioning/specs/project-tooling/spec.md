## MODIFIED Requirements

### Requirement: Documentation and automation are publication-ready
The repository SHALL include an English README, contributor and security guidance, license, source comments, tests, fixtures, specifications, documentation, CI, browser smoke tests, and PNG screenshots without demo video. The reviewed Russian message catalog SHALL be the only source file permitted to contain Cyrillic product copy. Public Org Tools state and import contracts SHALL be unversioned, current-only, synthetic where bundled, and validated by production parsers without legacy migrations.

#### Scenario: Continuous validation
- **WHEN** the CI workflow runs on a clean checkout
- **THEN** install, lint, typecheck, locale, unversioned state and import contract, tag normalization, calendar index, export, unit, build, OpenSpec, localized browser smoke, and public-safety checks complete successfully

#### Scenario: Current-schema policy
- **WHEN** a future change modifies a public state or import interface
- **THEN** obsolete types, readers, migrations, fixtures, documentation, and tests are removed in the same change rather than retained for backward compatibility

#### Scenario: Screenshot generation
- **WHEN** the screenshot command runs against the production build
- **THEN** deterministic English PNG screenshots cover the maintained product surfaces without obsolete versioned examples

#### Scenario: Publication language scan
- **WHEN** the public-safety check scans tracked source files and the production build
- **THEN** Cyrillic outside the exact Russian message catalog path causes a failing exit code
