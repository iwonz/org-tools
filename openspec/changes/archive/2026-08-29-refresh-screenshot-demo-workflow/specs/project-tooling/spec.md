## ADDED Requirements

### Requirement: Repository changes complete one closed delivery lifecycle
Every repository change MUST begin from a clean current default branch, proceed through one isolated
OpenSpec change, and finish integrated, published when allowed, archived, validated, and free of
dangling work.

#### Scenario: Clean current start
- **WHEN** a contributor begins a repository change
- **THEN** they fetch the configured origin, update `main` without rewriting history, verify that the
  worktree is clean and `main` matches `origin/main`, and resolve any active OpenSpec change before
  creating new work

#### Scenario: Isolated OpenSpec implementation
- **WHEN** the clean baseline is ready
- **THEN** the contributor creates a short-lived `change/<openspec-change-name>` branch, creates or
  continues exactly one OpenSpec change, reads its artifacts and relevant documentation, and keeps
  implementation, tests, documentation, and task status together

#### Scenario: Validated and archived change
- **WHEN** implementation tasks are complete
- **THEN** formatting, static checks, unit tests, production build, browser tests, screenshot
  generation and visual review, deterministic screenshot verification, public-safety checks,
  OpenSpec validation, and diff checks pass before delta specs are synchronized and the completed
  change is archived

#### Scenario: Integrated delivery
- **WHEN** the archived change is ready for delivery and publication is allowed
- **THEN** the contributor creates meaningful commits, updates and merges into `main`, pushes `main`
  to the configured origin, removes the merged change branch, and verifies that local `HEAD`, local
  `main`, and `origin/main` agree with a clean worktree, no unique change commits, and no active
  OpenSpec changes

#### Scenario: Explicit publication exception
- **WHEN** the user explicitly forbids publication or an external service blocks the final merge or
  push
- **THEN** the contributor preserves the safest clean local state and reports the exact incomplete
  integration instead of claiming that the delivery lifecycle is complete

## MODIFIED Requirements

### Requirement: Documentation and automation are publication-ready
The repository SHALL include an English README with a concise product summary, a curated gallery of
exactly ten local deterministic screenshot previews linked to their full-size PNGs, and minimal
local-start instructions, together with contributor and security guidance, license, source comments,
tests, fixtures, specifications, detailed documentation, CI, browser smoke tests, and PNG screenshots
without demo video. The reviewed Russian message catalog SHALL be the only source file permitted to
contain Cyrillic product copy. The sole public Org Tools state contract SHALL be unversioned,
current-only, content-scoped, synthetic where bundled, and validated by the production parser
without a separate import schema or legacy migrations. Ordinary mapped import SHALL accept JSON
only, and publication rules SHALL be expressed as general repository checks.

#### Scenario: README visual demo
- **WHEN** a visitor opens the rendered repository README
- **THEN** they can quickly understand the product, inspect full-size Import, Export, theme,
  language, Teams, Employees, Editor, Analytics, Calendar, and Download screenshots through direct
  local image links, and find the commands required to run it locally

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
- **THEN** it replaces the gallery with exactly ten deterministic PNGs showing meaningful synthetic
  Import, Export, theme, language, Teams, Employees, Editor, Analytics, Calendar, and Download states

#### Scenario: Screenshot manifest consistency
- **WHEN** screenshot generation or publication checks inspect the gallery
- **THEN** the checked-in scenario manifest, files in the screenshot directory, README links, and
  screenshot-documentation links match exactly, with no missing, duplicate, or stale PNG

#### Scenario: Publication language scan
- **WHEN** the public-safety check scans tracked source files and the production build
- **THEN** Cyrillic outside the exact Russian message catalog path causes a failing exit code
