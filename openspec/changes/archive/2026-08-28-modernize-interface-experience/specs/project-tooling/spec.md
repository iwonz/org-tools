## MODIFIED Requirements

### Requirement: Documentation and automation are publication-ready
The repository SHALL include an English README with a concise product summary, a curated gallery of
local deterministic screenshot previews linked to their full-size PNGs, and minimal local-start
instructions, together with contributor and security guidance, license, source comments, tests,
fixtures, specifications, detailed documentation, CI, browser smoke tests, and PNG screenshots
without demo video. The reviewed Russian message catalog SHALL be the only source file permitted to
contain Cyrillic product copy. The sole public Org Tools state contract SHALL be unversioned,
current-only, content-scoped, synthetic where bundled, and validated by the production parser
without a separate import schema or legacy migrations. Ordinary mapped import SHALL accept JSON
only, and publication rules SHALL be expressed as general repository checks.

#### Scenario: README visual demo
- **WHEN** a visitor opens the rendered repository README
- **THEN** they can quickly understand the product, inspect curated screenshots at full size through
  direct local image links, and find the commands required to run it locally

#### Scenario: Continuous validation
- **WHEN** the CI workflow runs on a clean checkout
- **THEN** install, lint, typecheck, locale, collapsible responsive sidebar, scoped state, virtualized
  import preview, layered interface chrome, generic JSON mapping, tag packing, editor and PNG
  geometry, data download, unit, build, OpenSpec, localized browser smoke, and public-safety checks
  complete successfully

#### Scenario: Current-schema policy
- **WHEN** a future change modifies the public state interface
- **THEN** obsolete types, readers, migrations, fixtures, documentation, and tests are removed in the
  same change rather than retained for backward compatibility

#### Scenario: Removed import contract scan
- **WHEN** publication checks scan source, tests, documentation, and built assets
- **THEN** the obsolete separate structured-import document kind, format examples, version fields,
  CSV-import paths, and compatibility code are absent

#### Scenario: Screenshot generation
- **WHEN** the screenshot command runs against the production build
- **THEN** deterministic English PNG screenshots cover the expanded and compact responsive sidebar,
  sidebar-owned locale and theme controls, layered light and dark chrome, explicit borderless
  navigation states, centered compact icons, the stable rounded-square collapse control, adaptive
  Editor grid density, uniform Analytics grouping, the utilitarian steel-blue and blue-gray
  interaction palette, a title-free sidebar with one fixed toggle/icon axis, geometry-stable pressed
  states, restrained overlay-only elevation, purposeful workflow grouping, state import, generic
  JSON mapping, hidden tag dates, and wrapping tags

#### Scenario: Publication language scan
- **WHEN** the public-safety check scans tracked source files and the production build
- **THEN** Cyrillic outside the exact Russian message catalog path causes a failing exit code
