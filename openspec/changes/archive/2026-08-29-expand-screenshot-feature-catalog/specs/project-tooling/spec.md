## MODIFIED Requirements

### Requirement: Documentation and automation are publication-ready
The repository SHALL include an English README with a concise product summary, a curated showcase of
exactly ten local deterministic screenshot previews linked to their full-size PNGs, and minimal
local-start instructions, together with a comprehensive grouped screenshot capability catalog,
contributor and security guidance, license, source comments, tests, fixtures, specifications,
detailed documentation, CI, browser smoke tests, and PNG screenshots without demo video. The
reviewed Russian message catalog SHALL be the only source file permitted to contain Cyrillic product
copy. The sole public Org Tools state contract SHALL be unversioned, current-only, content-scoped,
synthetic where bundled, and validated by the production parser without a separate import schema or
legacy migrations. Ordinary mapped import SHALL accept JSON only, and publication rules SHALL be
expressed as general repository checks.

#### Scenario: README visual showcase
- **WHEN** a visitor opens the rendered repository README
- **THEN** they can quickly understand the product, inspect exactly one featured full-size Import,
  Export, theme, language, Teams, Employees, Editor, Analytics, Calendar, and Download screenshot
  through direct local image links, and find the commands required to run it locally

#### Scenario: Complete visual capability catalog
- **WHEN** a visitor opens the detailed screenshot guide
- **THEN** every primary workflow has its featured frame plus grouped supporting frames and explicit
  capability descriptions that collectively explain all meaningful user-visible functionality

#### Scenario: Visual documentation changes with the product
- **WHEN** a repository change adds, removes, or materially changes user-visible functionality
- **THEN** the same change updates the screenshot capability manifest, affected generated frames,
  detailed guide, and featured README frame when applicable

#### Scenario: Continuous validation
- **WHEN** the CI workflow runs on a clean checkout
- **THEN** install, lint, typecheck, locale, collapsible responsive sidebar, scoped state, virtualized
  import preview, layered interface chrome, generic JSON mapping, tag packing, editor and PNG
  geometry, data download, unit, build, OpenSpec, localized browser smoke, and public-safety checks
  complete successfully

#### Scenario: Current-schema policy
- **WHEN** a future change modifies the public state interface
- **THEN** obsolete types, readers, migrations, fixtures, documentation, and tests are removed in the same change rather than retained for backward compatibility

#### Scenario: Removed import contract scan
- **WHEN** publication checks scan source, tests, documentation, and built assets
- **THEN** the obsolete separate structured-import document kind, format examples, version fields, CSV-import paths, and compatibility code are absent

#### Scenario: Screenshot generation
- **WHEN** the screenshot command runs against the production build
- **THEN** it replaces the gallery with every manifest frame using deterministic synthetic data,
  including exactly ten featured primary-workflow PNGs and all declared supporting feature states

#### Scenario: Screenshot manifest consistency
- **WHEN** screenshot generation or publication checks inspect the gallery
- **THEN** identifiers and filenames are unique, exactly one entry per primary workflow is featured,
  every entry declares its module and visible capabilities, files equal the complete manifest,
  README links equal only featured files, and screenshot-guide links equal all files, with no
  missing, duplicate, or stale PNG

#### Scenario: Publication language scan
- **WHEN** the public-safety check scans tracked source files and the production build
- **THEN** Cyrillic outside the exact Russian message catalog path causes a failing exit code
