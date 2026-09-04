# project-tooling Specification

## Purpose
Define the specification workflow, privacy-preserving development commands, and public automation.
## Requirements
### Requirement: OpenSpec governs repository changes
The repository SHALL include the Codex OpenSpec integration, English project context, strict
validation, and archived capability specifications.

#### Scenario: Specification validation
- **WHEN** `pnpm spec:validate` runs
- **THEN** all active changes and main specs pass strict non-interactive validation

#### Scenario: Telemetry-free specification commands
- **WHEN** a contributor runs OpenSpec through `pnpm spec -- ...`
- **THEN** the repository wrapper applies the CLI's documented telemetry opt-out variables

### Requirement: Package-manager startup is reproducible
The repository SHALL declare exact pnpm 11.24.0 selection through `packageManager`, SHALL keep local
and CI commands aligned with that declaration, and SHALL allow a Corepack-selected matching pnpm to
run `pnpm dev` without a package-manager version-policy failure.

#### Scenario: Corepack development startup
- **WHEN** Corepack invokes pnpm 11.24.0 from the repository root and a contributor runs `pnpm dev`
- **THEN** package-manager validation succeeds and the documented development launcher starts

#### Scenario: Frozen dependency graph
- **WHEN** pnpm 11.24.0 validates or installs the repository with the frozen lockfile
- **THEN** it accepts the committed dependency graph without an unrelated resolution rewrite

#### Scenario: CI package-manager selection
- **WHEN** GitHub automation installs the package manager declared by the repository
- **THEN** it selects pnpm 11.24.0 before dependency installation and repository commands

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
The repository SHALL document stable UUID Employee identity, normalized duplicate detection,
State/Employees transfer, the system and isolated custom Editor Views, local runtimes, privacy, and
scale behavior. It SHALL include an
English README with exactly ten deterministic featured screenshot previews, a comprehensive grouped
screenshot catalog, contributor and security guidance, license, tests, specifications, detailed
documentation, CI, and generated PNGs. Non-English product copy SHALL live only in its corresponding
locale catalog; source, comments, fixtures, tests, specifications, and documentation SHALL remain
English. The public state contract SHALL be unversioned, current-only,
complete, and validated without discriminators, partial scopes, legacy migration, project metadata,
or compatibility readers. Employee mapping is supported only by the explicit Employee transfer mode.

#### Scenario: README visual showcase
- **WHEN** a visitor opens README
- **THEN** exactly one full-size Import, Export, theme, language, Teams, Employees, Editor, Analytics,
  Calendar, and Download preview is linked locally

#### Scenario: Complete visual capability catalog
- **WHEN** a visitor opens the detailed screenshot guide
- **THEN** the 58-frame gallery contains ten featured workflows and only currently visible supporting
  behavior, without project, file, Save, autosave, or obsolete conflict frames

#### Scenario: Continuous validation
- **WHEN** CI runs on a clean checkout
- **THEN** locale completeness, singleton repository/API, tab synchronization, automatic writes,
  frame-coalesced Editor interaction, complete state transfer, both builds, browser suites,
  screenshots, OpenSpec, and public-safety checks pass against isolated synthetic state

#### Scenario: Current-schema policy
- **WHEN** the state and Employee transfer contracts change
- **THEN** old View shapes, digest Employee IDs, inline Tags, obsolete custom/output state, fixtures,
  docs, and tests are removed together

#### Scenario: Large transfer validation
- **WHEN** performance coverage maps and reviews 20,000 Employees
- **THEN** it verifies linear derivation, sparse overrides, virtualized rows, and one atomic Apply

#### Scenario: Screenshot generation
- **WHEN** screenshot generation runs against both production runtimes
- **THEN** it deterministically replaces exactly 58 declared PNGs, including ten featured frames

#### Scenario: Screenshot manifest consistency
- **WHEN** generation or publication checks inspect the gallery
- **THEN** identifiers and filenames are unique, featured and guide links match the manifest, and
  removed persistence images are absent

#### Scenario: Publication language scan
- **WHEN** public-safety checks scan tracked source and production output
- **THEN** non-English product copy outside its corresponding locale catalog fails validation

#### Scenario: Large Editor interaction validation
- **WHEN** automated performance coverage prepares 20,000 Employees and 4,000 Units
- **THEN** pan and Unit drag preview produce no durable writes before completion, one final logical
  write after completion, and no per-event full Unit visibility scan

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

### Requirement: Browser validation fails on unexpected runtime diagnostics
Development and production browser validation SHALL monitor every owned page for console errors and
warnings, uncaught page errors, hydration diagnostics, failed application requests, and failing
same-origin resource responses. React, Next.js, MobX, localization, accessibility, and application
diagnostics MUST NOT be suppressed or allowlisted. Any exception for browser-generated noise MUST
be narrow, documented beside its matcher, and include no organization data.

#### Scenario: Development React diagnostic
- **WHEN** the development probe renders and interacts with the application while React development
  diagnostics are enabled
- **THEN** a render-phase update, hydration mismatch, uncaught error, or unexpected console warning
  fails the probe with its source and message

#### Scenario: Complete production workflow audit
- **WHEN** the maintained server and Pages browser catalogs exercise Import, Export, theme,
  language, Teams, Employees, Editor, Analytics, Calendar, Data Download, menus, dialogs, and
  representative mutations
- **THEN** every page finishes without an unexpected console error or warning, page error, failed
  application request, or failing same-origin resource response

#### Scenario: Actionable failure report
- **WHEN** an unexpected browser diagnostic occurs
- **THEN** validation reports the runtime, scenario, diagnostic category, URL when available, and
  message without transmitting the diagnostic or synthetic state outside the local test process

### Requirement: Public automation uses supported action runtimes
Repository CI and Pages publication workflows SHALL use maintained official action major versions
whose declared inputs are supported and whose JavaScript runtimes are accepted by GitHub-hosted
runners without deprecation annotations.

#### Scenario: CI workflow starts
- **WHEN** GitHub runs the repository validation workflow on a clean checkout
- **THEN** checkout, package-manager setup, Node.js setup, and screenshot artifact upload execute on
  their maintained action runtimes without deprecated-runtime annotations

#### Scenario: Pages workflow uploads the complete artifact
- **WHEN** GitHub runs the manually dispatched Pages workflow
- **THEN** configuration, hidden-file artifact upload, and deployment use supported action majors
  and accepted inputs without deprecated-runtime or unexpected-input annotations

### Requirement: Documentation and gallery cover current product surfaces
The repository SHALL document both local-only runtimes, six bundled locales, Arabic RTL, isolated
Editor Views over global Employees, Analytics bound to the system View, View-selectable Data
Download, wrapped direct Tag footers, modal Language and Theme settings, selected-only Editor
arrangement, direct State Export, source-driven Employee Import, colored Editor PNG Tags, privacy,
performance, and screenshots without obsolete guidance. The deterministic gallery SHALL contain
exactly 58 PNGs and the README SHALL retain exactly ten featured Import, Export, Theme, Language,
Units, Employees, Editor, Analytics, Calendar, and Download frames.

#### Scenario: Complete gallery
- **WHEN** screenshot generation runs against the production runtimes
- **THEN** it deterministically replaces exactly 58 declared PNGs covering only current product workflows

#### Scenario: Locale gallery
- **WHEN** Language frames are generated
- **THEN** the primary frame shows six flagged language rows and the supporting frame demonstrates Arabic RTL

#### Scenario: Updated workflow gallery
- **WHEN** Editor, Units, Calendar, Language, Import, Download, and Tag frames are generated
- **THEN** they show View selection and management, direct Tag footers, View Download source, colored PNG Tags, rose weekends, flags, target Selects, and flat spaced Tag management

#### Scenario: View workflow gallery
- **WHEN** the four supporting View frames are generated
- **THEN** they show the selector, Blank/Copy dialog, isolated custom document, and Rename/Delete lifecycle with synthetic data

#### Scenario: Transfer gallery
- **WHEN** screenshot generation completes
- **THEN** featured Import shows State and Employee modes while supporting frames show source-driven mapping and explicit database recreation

#### Scenario: Tag management gallery
- **WHEN** Tag supporting frames are generated
- **THEN** catalog, rename, quick color, full Employee membership, and separated padding-free rows are visible across the maintained scenarios

#### Scenario: Structured-output gallery
- **WHEN** screenshot generation completes
- **THEN** Data Download shows its View source, JSON collections, exact exclusions, bounded preview, Template, and token suggestions while Editor shows Image, JSON, and Template for the active View

#### Scenario: Editor gallery
- **WHEN** Editor frames are generated
- **THEN** the system selector and protected management state are visible without restoring View-local Employee copies or overrides

#### Scenario: Featured README
- **WHEN** a visitor opens README
- **THEN** the same ten current product previews remain featured and every linked PNG exists

#### Scenario: Deterministic generation
- **WHEN** the 58-frame gallery is generated twice from unchanged source and fixed fixtures
- **THEN** every PNG hash is identical and every owned page has no unexpected console or network diagnostic

### Requirement: Localization validation covers every supported catalog
Automated checks SHALL validate exact keys, placeholders, non-empty translations, allowed technical
tokens, browser detection, writing direction, and representative visible and accessibility surfaces
for `en`, `zh`, `ru`, `es`, `fr`, and `ar` in both production runtimes.

#### Scenario: Validate six catalogs
- **WHEN** repository and browser validation runs
- **THEN** every supported locale passes static parity and runtime surface checks without fallback copy

#### Scenario: Validate large localized data
- **WHEN** Analytics and Editor exercise 20,000 Employees and 4,000 Units
- **THEN** locale-only UI changes do not serialize organization state or trigger per-frame full scans

### Requirement: Gallery documents Employee schema, Tags, and Calendar
The deterministic gallery SHALL contain 58 PNG files: the maintained workflows plus View selection,
copy creation, isolated editing, rename/delete, and Unit note Preview/Editor scenarios. Every PNG SHALL use synthetic data and
appear identically across two generations.

#### Scenario: Regenerate the gallery
- **WHEN** screenshots are generated twice from the same clean production build
- **THEN** all 58 referenced PNG files exist and their SHA-256 manifests match

### Requirement: Large-model validation remains bounded
Automated checks SHALL exercise 20,000 Employees and 4,000 Units with identity, Tag, custom field,
Import, filter, and output indexes, and SHALL fail on organization serialization or complete-list
rendering caused only by UI interaction.

#### Scenario: Filter the large fixture
- **WHEN** a custom filter changes on the maintained fixture
- **THEN** indexed matching and virtualized options respond without rebuilding organization state

### Requirement: Gallery verifies Tag fill semantics
The deterministic screenshot gallery SHALL show named and arbitrary Tag colors as readable filled
surfaces without separate leading color dots in representative Employee, Tag catalog, Calendar,
assignment, and Editor PNG workflows. Tag supporting frames SHALL show the separate rename modal,
row-level quick color Popover with exact type Select above it, and full Employee membership dialog.
The maintained Template token frame SHALL show the Format help affordance and localized guidance.

#### Scenario: Regenerate Tag-bearing frames
- **WHEN** the maintained gallery is generated twice from unchanged source
- **THEN** affected PNGs show named and arbitrary fills, flat rows, quick color, rename, membership, and identical hash manifests

#### Scenario: Validate exact custom color behavior
- **WHEN** browser validation enters HTML Keyword, HEX, RGB, and RGBA colors in both runtimes
- **THEN** each valid input resolves to its canonical color, invalid input preserves the previous value, and the type Select remains above its Popover

#### Scenario: Validate Format guidance
- **WHEN** browser validation visits each token-aware Format surface
- **THEN** a help icon follows the label and exposes localized `@` guidance on hover and keyboard focus

### Requirement: Gallery verifies compact Unit Tag footers
The maintained Editor screenshots SHALL show content-sized direct-Tag footer chips with equal compact
insets and without a large empty trailing area. Screenshot generation SHALL retain the maintained 58
declared scenarios.

#### Scenario: Regenerate Editor frames
- **WHEN** the deterministic gallery is generated twice from unchanged source
- **THEN** affected Editor frames show compact evenly inset footer chips and all 58 PNG hashes match between runs

### Requirement: Large multi-View validation remains bounded
Automated checks SHALL exercise global Employee mutation, active View switching, Data Download source
switching, and Tag footer derivation with 20,000 Employees and 4,000 Units without eager inactive-View
rebuilds, UI-triggered organization serialization, or complete-list rendering.

#### Scenario: Switch a large View
- **WHEN** the maintained large fixture changes active View, viewport, or selection
- **THEN** only required derived structures build and no organization write occurs until a structural command

### Requirement: Gallery and browser checks cover refined cross-View interactions
The maintained 58-frame deterministic gallery SHALL cover the current scenario set while updating the
Editor View, clipboard, and Unit footer frames. Browser validation SHALL exercise cross-View paste,
all four edge-pan drag modes, nested and multi-selection deletion, and tooltip absence in both server
and Pages runtimes without console, page, resource, or external-network diagnostics.

#### Scenario: Regenerate affected Editor frames
- **WHEN** the 58-frame gallery is generated twice from unchanged source and fixtures
- **THEN** complete wrapping footer Tags and the current View interactions appear with identical SHA-256 manifests

#### Scenario: Validate large interaction performance
- **WHEN** edge-pan and deletion are exercised with 20,000 Employees and 4,000 Units
- **THEN** no drag frame serializes organization state or performs a complete Unit scan and release creates at most one viewport commit and one structural command

### Requirement: Validation and gallery cover Unit Markdown notes
Repository validation SHALL cover strict Unit note state, View-local history and copying, safe
Markdown, both runtime persistence paths, localization, accessibility, and browser diagnostics. The
deterministic gallery SHALL contain exactly 58 PNGs including Unit note Preview and Editor scenarios
while the README retains its ten featured frames.

#### Scenario: Generate Unit note frames
- **WHEN** screenshot generation runs twice from unchanged source and fixtures
- **THEN** all 58 PNGs have identical hashes and the two note frames show Preview and Editor with
  synthetic Markdown content

### Requirement: Validation and gallery cover Editor distribution mode
Repository validation SHALL cover strict View UI state, manual and Live membership, bounded
derivation, context-switch accessibility, persisted highlighting, single-selection connections,
multi-selection suppression, collapsed fallbacks, output exclusion, localization, and browser
diagnostics. The deterministic gallery SHALL contain exactly 58 PNGs while README retains ten
featured frames.

#### Scenario: Generate distribution frames
- **WHEN** screenshot generation runs twice from unchanged source and fixtures
- **THEN** all 58 hashes match and supporting frames show status highlighting plus selected placement connections

#### Scenario: Validate the large Editor
- **WHEN** 20,000 Employees and 4,000 Units exercise distribution mode
- **THEN** selection and viewport changes do not rebuild membership indexes, scan all Units, or write organization state

#### Scenario: Validate a large noted Editor
- **WHEN** performance coverage renders 20,000 Employees and 4,000 Units with closed notes
- **THEN** no note Markdown is parsed, no organization write occurs, and spatial canvas behavior
  remains bounded

### Requirement: Validation covers Tag-filter bulk selection
Repository validation SHALL cover complete Tag selection, complete deselection, disabled states,
Without tags independence, shared filter consumers, six locales, RTL, large virtualized catalogs,
both runtimes, and browser diagnostics. The maintained deterministic gallery SHALL remain exactly 58
PNGs and update its existing Employee-filter frame without adding a scenario.

#### Scenario: Validate shared filter consumers
- **WHEN** browser coverage exercises Tag filters in ordinary and Live Unit workflows
- **THEN** the same bulk controls and one-update semantics work without console, page, resource, or network diagnostics

#### Scenario: Regenerate the gallery
- **WHEN** screenshot generation runs twice from unchanged source and fixtures
- **THEN** all 58 hashes match and the existing Employee-filter frame shows the bulk Tag actions

### Requirement: Validation covers bulk distribution and Tag discovery
Repository validation SHALL cover single, all, and mixed distribution selections, one bounded UI
update, multi-placement row actions, read-only map navigation, searchable locale-aware Tag options,
search-scoped bulk selection, inline catalog counts, both runtimes, six locales, RTL, browser
diagnostics, and maintained large-model limits. The deterministic gallery SHALL contain exactly 58
PNGs while README retains ten featured frames.

#### Scenario: Validate both runtimes
- **WHEN** browser coverage exercises the workflows in server and Pages applications
- **THEN** behavior matches without console, page, resource, or unexpected network diagnostics

#### Scenario: Validate the large model
- **WHEN** 20,000 Employees and 4,000 Units exercise the placement map and Tag filters
- **THEN** viewport and selection do not rebuild membership indexes, the map reads only one Employee's placements, and Tag rows remain virtualized

#### Scenario: Regenerate the gallery
- **WHEN** screenshot generation runs twice from unchanged source and fixtures
- **THEN** all 58 hashes match and supporting frames show bulk distribution plus Employee placement navigation
