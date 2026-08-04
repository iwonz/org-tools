## MODIFIED Requirements

### Requirement: Documentation and automation are publication-ready
The repository SHALL include an English README, contributor and security guidance, license, source
comments, tests, fixtures, specifications, documentation, CI, browser smoke tests, and PNG
screenshots without demo video. The reviewed Russian message catalog SHALL be the only source file
permitted to contain Cyrillic product copy. The sole public Org Tools state contract SHALL be
unversioned, current-only, content-scoped, synthetic where bundled, and validated by the production
parser without a separate import schema or legacy migrations. Ordinary mapped import SHALL accept
JSON only.

#### Scenario: Continuous validation
- **WHEN** the CI workflow runs on a clean checkout
- **THEN** install, lint, typecheck, locale, scoped state, generic JSON mapping, tag packing, editor and PNG geometry, data download, unit, build, OpenSpec, localized browser smoke, and public-safety checks complete successfully

#### Scenario: Current-schema policy
- **WHEN** a future change modifies the public state interface
- **THEN** obsolete types, readers, migrations, fixtures, documentation, and tests are removed in the same change rather than retained for backward compatibility

#### Scenario: Removed import contract scan
- **WHEN** publication checks scan source, tests, documentation, and built assets
- **THEN** the obsolete separate structured-import document kind, format examples, version fields, CSV-import paths, and compatibility code are absent

#### Scenario: Screenshot generation
- **WHEN** the screenshot command runs against the production build
- **THEN** deterministic English PNG screenshots cover scoped state Export/import, generic JSON mapping, hidden tag dates, wrapping tags, and the shadow-free monochrome logo

#### Scenario: Publication language scan
- **WHEN** the public-safety check scans tracked source files and the production build
- **THEN** Cyrillic outside the exact Russian message catalog path causes a failing exit code
