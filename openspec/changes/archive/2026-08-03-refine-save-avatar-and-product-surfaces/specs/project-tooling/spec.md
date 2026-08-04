## MODIFIED Requirements

### Requirement: Documentation and automation are publication-ready
The repository SHALL include an English README, contributor and security guidance, license, source
comments, tests, fixtures, specifications, documentation, CI, browser smoke tests, and PNG
screenshots without demo video. The reviewed Russian message catalog SHALL be the only source file
permitted to contain Cyrillic product copy. Bundled version 2 import interfaces and examples SHALL
be synthetic, English-keyed, and validated by the production parsers.

#### Scenario: Continuous validation
- **WHEN** the CI workflow runs on a clean checkout
- **THEN** install, lint, typecheck, locale and V2 contract tests, unit tests, build, OpenSpec validation, localized browser smoke, and public-safety checks complete successfully

#### Scenario: Screenshot generation
- **WHEN** the screenshot command runs against the production build
- **THEN** deterministic English PNG screenshots cover revised import, Save, avatar, Calendar, Analytics, and shell surfaces

#### Scenario: Publication language scan
- **WHEN** the public-safety check scans tracked source files and the production build
- **THEN** Cyrillic outside the exact Russian message catalog path causes a failing exit code
