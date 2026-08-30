## MODIFIED Requirements

### Requirement: Documentation and automation are publication-ready
The repository SHALL include an English README with a concise product summary, a curated set of
exactly ten local deterministic featured screenshot previews linked to their full-size PNGs, and
minimal local-start instructions, together with a comprehensive grouped screenshot capability
catalog, contributor and security guidance, license, source comments, tests, fixtures,
specifications, detailed documentation, CI, browser smoke tests, and PNG screenshots without demo
video. The reviewed Russian message catalog SHALL be the only source file permitted to contain
Cyrillic product copy. The sole public Org Tools state contract SHALL be unversioned, current-only,
workspace-only, synthetic where bundled, and validated by the production parser without partial
content, generic mapping, a separate import schema, or legacy migrations. Project and SQLite
metadata SHALL remain outside that public state, and publication rules SHALL be expressed as general
repository checks.

#### Scenario: README visual showcase
- **WHEN** a visitor opens the rendered repository README
- **THEN** they can quickly understand the product, inspect exactly one featured full-size Import,
  Export, theme, language, Teams, Employees, Editor, Analytics, Calendar, and Download screenshot
  through direct local image links, and find the commands required to run it locally

#### Scenario: Complete visual capability catalog
- **WHEN** a visitor opens the detailed screenshot guide
- **THEN** every primary workflow has one featured frame, workflows with additional visible states
  have grouped supporting frames, and cross-cutting project frames explain switch, link, create,
  rename, delete, Save, and conflict behavior

#### Scenario: Visual documentation changes with the product
- **WHEN** a repository change adds, removes, or materially changes user-visible functionality
- **THEN** the same change updates the screenshot capability manifest, affected generated frames,
  detailed guide, and featured README frame when applicable

#### Scenario: Continuous validation
- **WHEN** the CI workflow runs on a clean checkout
- **THEN** install, lint, typecheck, SQLite repository and API, locale, project lifecycle, Save and
  conflict, collapsible responsive sidebar, complete workspace transfer, transient status, outlined
  dropdowns, tag packing, editor and PNG geometry, data download, unit, Node server build, OpenSpec,
  localized browser smoke, and public-safety checks complete successfully against isolated state

#### Scenario: Current-schema policy
- **WHEN** a future change modifies the public state interface
- **THEN** obsolete types, readers, migrations, fixtures, documentation, and tests are removed in the
  same change rather than retained for backward compatibility

#### Scenario: Removed transfer contract scan
- **WHEN** publication checks scan source, tests, documentation, and built assets
- **THEN** partial state content, projection filenames, mapping modules and examples, version fields,
  and compatibility code are absent

#### Scenario: Screenshot generation
- **WHEN** the screenshot command runs against both production runtimes
- **THEN** it replaces the 48-frame gallery using deterministic synthetic data and an isolated
  temporary database, including exactly ten featured primary-workflow PNGs and every declared
  supporting feature and project state

#### Scenario: Screenshot manifest consistency
- **WHEN** screenshot generation or publication checks inspect the gallery
- **THEN** identifiers and filenames are unique, exactly one entry per primary workflow is featured,
  supporting-only cross-cutting modules are permitted, supporting frames are required only when the
  manifest declares additional UI behavior, files equal the complete manifest, README links equal
  only featured files, and screenshot-guide links equal all files

#### Scenario: Publication language scan
- **WHEN** the public-safety check scans tracked source files and the production build
- **THEN** Cyrillic outside the exact Russian message catalog path causes a failing exit code
