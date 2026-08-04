## MODIFIED Requirements

### Requirement: Documentation and automation are publication-ready
The repository SHALL include an English README, contributor and security guidance, license, source
comments, tests, fixtures, specifications, documentation, CI, browser smoke tests, and PNG
screenshots without demo video. The reviewed Russian message catalog SHALL be the only source file
permitted to contain Cyrillic product copy.

#### Scenario: Continuous validation
- **WHEN** the CI workflow runs on a clean checkout
- **THEN** install, lint, typecheck, locale catalog tests, unit tests, build, OpenSpec validation,
  localized browser smoke, and public-safety checks complete successfully

#### Scenario: Screenshot generation
- **WHEN** the screenshot command runs against the production build
- **THEN** deterministic English PNG screenshots are generated from local synthetic data

#### Scenario: Publication language scan
- **WHEN** the public-safety check scans tracked source files and the production build
- **THEN** Cyrillic outside the exact Russian message catalog path causes a failing exit code
