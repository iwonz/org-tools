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

### Requirement: MCP protocol and isolation have dedicated validation
The repository SHALL provide `pnpm mcp:check` as an isolated raw-protocol smoke test for disabled,
authentication, discovery, bounded read, Preview, Apply, idempotency, activity, and undo behavior.
Unit and browser validation SHALL additionally cover strict rejection of every non-current database
shape without mutation, token lifecycle, complete typed CRUD, expiry, staleness, selective undo
conflicts, revision reconciliation, localization, live UI updates, ready client configuration, and
absence of unexpected diagnostics or external requests.

#### Scenario: Isolated protocol smoke
- **WHEN** `pnpm mcp:check` runs against a temporary database through the actual route handler
- **THEN** it enables MCP through the same-origin control contract, authenticates, discovers protocol surfaces, applies and undoes one preview, and removes owned state

#### Scenario: Large organization reads
- **WHEN** validation uses 20,000 Employees and 4,000 Units
- **THEN** reads remain paginated and cached, UI-only actions do not serialize organization, and one Apply produces one snapshot and transaction

#### Scenario: Pages isolation scan
- **WHEN** Pages and publication checks inspect source and output
- **THEN** any MCP SDK, `/mcp` or MCP control reference, token prefix, server chunk, SQLite symbol, credential, or organization fixture fails validation

### Requirement: Documentation and gallery explain local agent access
The repository SHALL document MCP setup, trust boundaries, supported local clients, tools,
Preview -> Apply, activity, undo, revision reconciliation, and recovery in `docs/mcp.md` and the
existing architecture, privacy, performance, usage, screenshot, contributor, and README surfaces.
Client setup SHALL be ready to paste with the current token and no separate environment step. The
deterministic gallery SHALL contain exactly 43 PNGs: the existing 38 product scenarios plus disabled
consent, enabled credentials, client setup, applied activity, and selective-undo conflict. The README
SHALL retain exactly ten featured product frames, and generated frames MUST NOT contain a real token.

#### Scenario: MCP documentation
- **WHEN** a local user selects one supported client in the MCP Setup tab
- **THEN** bundled instructions contain the loopback endpoint and current token without requiring an environment step, remote tunnel, or fetched documentation

#### Scenario: Complete gallery
- **WHEN** screenshot generation runs against the production runtimes
- **THEN** it deterministically replaces exactly 43 declared PNGs and the five MCP frames originate only from server mode without a real credential

#### Scenario: Featured README
- **WHEN** a visitor opens README
- **THEN** the same ten Import, Export, theme, language, Teams, Employees, Editor, Analytics, Calendar, and Download previews remain featured

#### Scenario: Deterministic generation
- **WHEN** the 43-frame gallery is generated twice from unchanged source and fixed fixtures
- **THEN** every PNG hash is identical and every owned page has no unexpected console or network diagnostic
