## MODIFIED Requirements

### Requirement: Documentation and automation are publication-ready
The repository SHALL include an English README, contributor and security guidance, license, source comments, tests, fixtures, specifications, documentation, CI, browser smoke tests, and PNG screenshots without demo video. The reviewed Russian message catalog SHALL be the only source file permitted to contain Cyrillic product copy. Bundled version 3 import interfaces and examples SHALL be synthetic, English-keyed, and validated by production parsers; legacy State V1 and Import V2 fixtures SHALL validate migration only.

#### Scenario: Continuous validation
- **WHEN** the CI workflow runs on a clean checkout
- **THEN** install, lint, typecheck, locale, State V2, Import V3, migration, tag normalization, calendar index, export, unit, build, OpenSpec, localized browser smoke, and public-safety checks complete successfully

#### Scenario: Screenshot generation
- **WHEN** the screenshot command runs against the production build
- **THEN** deterministic English PNG screenshots cover the revised Calendar, Employee form, tag popover, dated-tag dialogs, and maintained product surfaces

#### Scenario: Publication language scan
- **WHEN** the public-safety check scans tracked source files and the production build
- **THEN** Cyrillic outside the exact Russian message catalog path causes a failing exit code
