## MODIFIED Requirements

### Requirement: Local runtime and database artifacts are publication-safe
The repository SHALL build and test a Node.js 22.13+ Next.js server that binds to loopback and uses a
configurable ignored singleton SQLite file. Runtime databases, rollback journals, WAL files,
shared-memory files, local configuration, build output, and test databases SHALL NOT enter the
tracked or staged publication set. The public-safety scan SHALL inspect production output and reject
tracked database artifacts, local paths, organization data, obsolete project routes, and secrets.

#### Scenario: Production build and start
- **WHEN** contributors run documented build and start commands
- **THEN** the server renders one state at `/` and exposes only the same-origin singleton state API

#### Scenario: Default database remains untracked
- **WHEN** the application creates its default database or transient journal
- **THEN** Git status and staged publication remain unchanged

#### Scenario: Tracked database scan
- **WHEN** publication checks encounter a database, journal, WAL, shared-memory file, or local
  database configuration in tracked files
- **THEN** validation fails before publication

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
- **THEN** the 38-frame gallery contains ten featured workflows and only currently visible supporting
  behavior, without project, file, Save, autosave, or conflict frames

#### Scenario: Continuous validation
- **WHEN** CI runs on a clean checkout
- **THEN** locale completeness, singleton repository/API, tab synchronization, automatic writes,
  complete state transfer, both builds, browser suites, screenshots, OpenSpec, and public-safety
  checks pass against isolated synthetic state

#### Scenario: Current-schema policy
- **WHEN** the public state interface changes
- **THEN** obsolete types, readers, migrations, fixtures, docs, and tests are removed in the same
  change rather than retained

#### Scenario: Screenshot generation
- **WHEN** screenshot generation runs against both production runtimes
- **THEN** it deterministically replaces exactly 38 declared PNGs, including ten featured frames

#### Scenario: Screenshot manifest consistency
- **WHEN** generation or publication checks inspect the gallery
- **THEN** identifiers and filenames are unique, featured and guide links match the manifest, and
  removed persistence images are absent

#### Scenario: Publication language scan
- **WHEN** public-safety checks scan tracked source and production output
- **THEN** Cyrillic outside the exact Russian catalog path fails validation

### Requirement: Development startup has a bounded functional probe
The repository SHALL provide a development smoke command that starts the loopback Next.js entry
point with an isolated singleton SQLite database, excludes runtime and diagnostic directories from
watching, verifies `/`, `GET /api/state`, the rendered shell, and Editor canvas, and always terminates
owned browser and server processes.

#### Scenario: Healthy development server
- **WHEN** `pnpm dev:check` runs with a free loopback port and Chromium
- **THEN** root remains `/`, the singleton API returns valid state, the Editor is interactive, and
  temporary runtime state is removed

#### Scenario: Runtime database write
- **WHEN** automatic persistence writes below `.org-tools`
- **THEN** the development compiler does not rebuild application modules for that runtime-only change

#### Scenario: Browser diagnostic write
- **WHEN** a smoke tool writes below `.playwright-cli`
- **THEN** the development compiler does not rebuild application modules for that diagnostic-only
  change

#### Scenario: Interactive cold start
- **WHEN** `pnpm dev` starts against an empty or existing singleton database
- **THEN** it reports ready only after root and state API compilation and initialization complete

#### Scenario: Development startup failure
- **WHEN** startup, SQLite, compilation, API, or browser rendering misses its deadline
- **THEN** owned processes and temporary state are cleaned and the command exits unsuccessfully with
  bounded diagnostics

### Requirement: Repository validation includes the static browser application
The repository SHALL provide development, static build, inspection, browser-test, and guarded
publication commands for the ignored GitHub Pages artifact.

#### Scenario: Build Pages application
- **WHEN** `pnpm pages:build` runs
- **THEN** it replaces `pages-out` with the static `/org-tools/` application and `.nojekyll`

#### Scenario: Validate Pages application
- **WHEN** Pages and publication checks inspect the artifact
- **THEN** they reject server modules, singleton API references, project routes, secrets, local paths,
  organization fixtures, file persistence code, missing assets, and an incorrect base path

#### Scenario: Continuous browser validation
- **WHEN** CI runs on a clean checkout
- **THEN** it builds and tests the SQLite and memory-only static runtimes before publication
