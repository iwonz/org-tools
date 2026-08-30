# project-tooling Specification

## Purpose
Define the specification workflow, privacy-preserving development commands, and public automation.
## Requirements
### Requirement: OpenSpec governs repository changes
The repository SHALL include the Codex OpenSpec integration, English project context, strict validation, and archived capability specifications.

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
configurable ignored SQLite file. Runtime databases, rollback journals, WAL files, shared-memory
files, local configuration, build output, and test databases SHALL NOT enter the tracked or staged
publication set. The public-safety scan SHALL inspect the production application and reject tracked
database artifacts, local paths, organization data, and secrets.

#### Scenario: Production build and start
- **WHEN** contributors run the documented build and start commands
- **THEN** the Next.js server serves project routes and same-origin APIs on `127.0.0.1` without
  requiring static `out` output

#### Scenario: Default database remains untracked
- **WHEN** the application creates its default database or SQLite creates a transient journal
- **THEN** Git status and the staged publication set remain unchanged

#### Scenario: Tracked database scan
- **WHEN** publication checks encounter a SQLite database, journal, WAL, shared-memory file, or local
  database configuration in the tracked set
- **THEN** the check fails before publication

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
- **THEN** obsolete types, readers, migrations, fixtures, documentation, and tests are removed in the same change rather than retained for backward compatibility

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

### Requirement: Development startup has a bounded functional probe
The repository SHALL provide a development smoke command that starts the documented loopback
Next.js development entry point with its explicit supported compiler and an isolated temporary
SQLite database inside the ignored runtime boundary, excludes runtime database writes from module
watching, excludes ignored browser-diagnostic writes from module watching, resolves the current
project through a pre-render server redirect, verifies project
initialization, stable browser routing, interactive rendered output, and the project list API, and
always terminates its browser and server child processes.

The interactive development command SHALL warm the root route, selected project route, and local
project API before presenting the workspace URL as ready, and SHALL forward termination to the
owned Next.js process.

#### Scenario: Healthy development server
- **WHEN** `pnpm dev:check` runs with a free loopback port and installed Chromium
- **THEN** the command observes the root navigation settle on a stable UUID project URL, the
  interactive application shell and Editor canvas become visible, the current project API response
  is valid, and temporary browser and database state are removed before success

#### Scenario: Runtime database write
- **WHEN** project startup or interaction writes a database, journal, or configuration below the
  reserved `.org-tools` runtime directory
- **THEN** the development compiler does not invalidate or rebuild application modules for that
  runtime-only change

#### Scenario: Browser diagnostic write
- **WHEN** a local browser smoke tool writes snapshots or logs below the ignored
  `.playwright-cli` directory
- **THEN** the development compiler does not invalidate or rebuild application modules for that
  diagnostic-only change

#### Scenario: Existing project root navigation
- **WHEN** `/` resolves an existing current project during development
- **THEN** the server redirects to its stable UUID route before page rendering and the browser does
  not depend on a streamed client redirect or development overlay timing

#### Scenario: Interactive cold start
- **WHEN** `pnpm dev` starts against an existing or newly created local database
- **THEN** it presents the workspace URL only after root resolution and initial project route and
  API compilation complete, so the first browser load reaches the interactive shell without a
  cold-compilation Fast Refresh race

#### Scenario: Development startup failure
- **WHEN** the server cannot start, initialize SQLite, compile through the documented compiler,
  settle browser routing, render the interactive shell, or answer within the fixed deadline
- **THEN** the command closes the browser, terminates the server child, removes temporary state,
  prints bounded diagnostic output, and exits unsuccessfully

### Requirement: Repository validation includes the static browser application
The repository SHALL provide development, static build, inspection, browser-test, and guarded
publication commands for the ignored GitHub Pages application artifact.

#### Scenario: Build Pages application
- **WHEN** `pnpm pages:build` runs
- **THEN** it replaces `pages-out` with the static `/org-tools/` application and `.nojekyll` without
  changing tracked files

#### Scenario: Validate Pages application
- **WHEN** Pages and publication checks inspect the artifact
- **THEN** they reject server modules, project API references, dynamic project routes, secrets, local
  paths, organization fixtures, missing static assets, and an incorrect base path

#### Scenario: Continuous browser validation
- **WHEN** CI runs on a clean checkout
- **THEN** it builds and tests the SQLite server and static browser runtimes before publication

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
