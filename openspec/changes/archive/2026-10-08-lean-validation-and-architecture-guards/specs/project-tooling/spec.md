## ADDED Requirements

### Requirement: Production dependencies follow explicit architecture boundaries
Repository validation SHALL parse the production TypeScript import graph, reject dependency cycles,
and enforce documented direction between shared contracts, foundational logic, server modules,
client stores, components, and application routes. Existing code MUST satisfy the graph without
path-specific exceptions, and the check MUST run in Fast and Core validation.

#### Scenario: Reject a reverse layer dependency
- **WHEN** foundational logic imports a client store or a component imports a server module
- **THEN** architecture validation fails with the source, target, and violated boundary

#### Scenario: Reject a production cycle
- **WHEN** production modules form a direct or transitive import cycle
- **THEN** architecture validation fails with the complete cycle path

#### Scenario: Share a cross-layer contract
- **WHEN** server, store, rendering, and export code require the same public type
- **THEN** the type is owned by shared contracts or foundational logic rather than a later runtime layer

### Requirement: Browser performance separates structural and timing evidence
Affected Editor validation SHALL block on deterministic large-model serialization, scan, write,
index, layout, and render budgets without using browser elapsed time. Full Regression SHALL warm the
20,000-Employee / 4,000-Unit workload, collect three timing windows, publish their values without
organization data, and reject only sustained or gross latency regression. Automatic retry MUST NOT
turn a failed timing assertion into passing evidence.

#### Scenario: Validate an affected Editor change
- **WHEN** Changed or Core validation exercises the large Editor workload
- **THEN** full scans, serialization, excess renders, and unexpected writes fail while frame timing is recorded without a blocking threshold

#### Scenario: Measure Full Regression timing
- **WHEN** nightly, manual, or release Full Regression runs
- **THEN** it fails when median pan p95 exceeds 100 ms, median input p95 exceeds 200 ms, or any measured latency exceeds 1000 ms

#### Scenario: Observe one noisy ordinary frame
- **WHEN** an ordinary Core runner produces a slow frame while every structural budget holds
- **THEN** the run does not retry or fail solely because of that elapsed sample

## MODIFIED Requirements

### Requirement: Repository changes complete one closed delivery lifecycle
Every repository change MUST begin from a clean current default branch, proceed through one isolated
OpenSpec change, and finish integrated, published when allowed, archived, locally validated, and free
of dangling work. Ordinary delivery SHALL confirm that expected remote workflows started without
waiting for their completion. Release-specific work, explicit publication work, or a user request
MUST still wait for the relevant remote result.

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
- **THEN** Fast validation and affected build, runtime, browser, screenshot, migration, audit,
  publication, and image checks pass before delta specs are synchronized and the completed change is archived

#### Scenario: Integrated ordinary delivery
- **WHEN** the archived change is ready for delivery and publication is allowed
- **THEN** the contributor creates meaningful commits, updates and merges into `main`, pushes `main`,
  confirms the expected remote workflows started, records their URLs, removes the merged change
  branch, and verifies clean matching local and remote refs without waiting for workflow completion

#### Scenario: Deliver a release-specific change
- **WHEN** the requested work creates or verifies a release or explicitly requires publication evidence
- **THEN** delivery waits for the relevant Release Please, GitHub Release, and GHCR results before completion

#### Scenario: Explicit publication exception
- **WHEN** the user explicitly forbids publication or an external service blocks the final merge or push
- **THEN** the contributor preserves the safest clean local state and reports the exact incomplete integration instead of claiming completion

### Requirement: Server and image validation cover delivery
Core CI SHALL run static and dependency-security checks for every change and, when affected runtime
or browser evidence is selected, start ephemeral PostgreSQL and exercise the selected Setup/Login,
authorization, persistence, output, or locale scenarios. Checked migration, production build,
publication, and image checks SHALL run when their inputs change. Full Regression SHALL additionally
run every browser scenario, migration/restart proof, production image inspection, large-model timing,
and two complete 56-frame gallery passes.

#### Scenario: Validate an ordinary pull request or main commit
- **WHEN** Core CI runs
- **THEN** all static, unit, security, affected runtime, key browser, build, and publication checks pass without publishing an image

#### Scenario: Validate a release candidate
- **WHEN** Full Regression runs for a Release Please PR
- **THEN** every browser, performance, migration, image, locale, gallery, OpenSpec, and publication-safety check passes before release merge

### Requirement: Changed validation is explanatory and conservative
The repository SHALL provide a changed-file validation stage that compares the merge base plus
staged, unstaged, and untracked paths, runs every non-networked inexpensive gate, and selects owned
runtime, browser-domain, screenshot, migration, dependency-audit, publication, and image feedback.
The stage MUST print selected and skipped gates with reasons. An unavailable base or unknown product
path MUST select all Core domains; validation-infrastructure changes MUST select Full Regression.
Its Compose wrapper MUST isolate and clean stateful validation.

#### Scenario: Validate a documentation-only change
- **WHEN** only known documentation and OpenSpec paths changed
- **THEN** Fast validation runs while runtime, browser, screenshot, migration, audit, and image feedback are explicitly skipped

#### Scenario: Validate an unknown product path
- **WHEN** the planner receives an application path without an owned domain rule
- **THEN** it selects production build, runtime probe, and every Core browser domain without selecting Full Regression

#### Scenario: Validate orchestration itself
- **WHEN** validation, browser discovery, screenshot selection, or CI orchestration changes
- **THEN** the local plan selects Full Regression and explains that the evidence mechanism changed

### Requirement: Complete validation remains authoritative
Core CI SHALL be the required ordinary pull-request and main gate. Full Regression SHALL remain the
authoritative exhaustive evidence and run nightly, by manual dispatch, and for Release Please pull
requests. It MUST run the full unit suite, every browser and performance scenario, two complete
56-image gallery passes with matching SHA-256 manifests, migration-backed runtime checks, production
build and publication scanning, and production image inspection.

#### Scenario: Core skips unrelated detailed scenarios
- **WHEN** affected Core validation completes with regression scenarios or screenshots skipped
- **THEN** the required ordinary gate succeeds from its declared evidence and the next Full Regression still executes every exhaustive gate

#### Scenario: Prepare a release
- **WHEN** a Release Please pull request is opened or updated
- **THEN** Full Regression runs and must pass before the release pull request is merged

#### Scenario: Run scheduled evidence
- **WHEN** the nightly schedule or a maintainer dispatch starts Full Regression
- **THEN** it ignores affected-path selection and executes the complete matrix

### Requirement: Full browser coverage uses isolated shards
Full Regression SHALL distribute browser scenarios across bounded shards only when every shard owns
an isolated PostgreSQL database, application runtime, migration run, session set, browser process,
and storage paths. Tests inside one shard SHALL remain serial. Core and ordinary local browser
execution SHALL use one worker unless explicitly assigned an isolated shard.

#### Scenario: Run Full Regression shards
- **WHEN** nightly, manual, or release Full Regression executes the browser suite
- **THEN** every Core, regression, authorization, persistence, localization, and performance scenario runs exactly once across isolated shards

#### Scenario: Run the ordinary local browser command
- **WHEN** a contributor runs affected browser validation without sharding
- **THEN** Playwright uses one worker and executes only selected domain tags against the isolated validation database

### Requirement: Screenshot capture waits for observed visual stability
Maintained screenshot capture SHALL wait for bundled fonts and embedded images, disable transient
animation, and require two consecutive bounded visual samples before accepting a PNG. Ordinary
small-delta pixels and explicitly marked raster-noise regions MUST retain independent 256-pixel
budgets. Affected validation SHALL generate selected committed frames once and fail on a remaining
repository diff. Full Regression SHALL generate all 56 frames twice and compare every SHA-256 hash.

#### Scenario: Capture affected frames
- **WHEN** Changed or Core validation selects visual modules or IDs
- **THEN** only those frames are generated once and committed screenshots remain unchanged after comparison

#### Scenario: Stable resources replace a fixed delay
- **WHEN** fonts and images become ready and two consecutive samples match
- **THEN** capture proceeds immediately without waiting for a fixed per-frame sleep

#### Scenario: Frame never stabilizes
- **WHEN** no consecutive visual samples match within the bounded attempt limit
- **THEN** capture fails with the scenario identifier and retains final diagnostic samples

#### Scenario: Full deterministic evidence
- **WHEN** Full Regression runs from unchanged source and fixtures
- **THEN** both complete 56-frame passes match each other and the committed gallery

### Requirement: Maintained validation audits repository hygiene and locked dependencies
The repository SHALL provide deterministic checks for architecture boundaries, cycles, dead tracked
source, generated or sensitive artifacts, obsolete current-runtime contracts, and locked dependency
advisories. Dependency auditing SHALL run in Core and Full CI and in local Changed validation when
manifest or lock inputs change. It MUST NOT run in the application or transmit organization data,
credentials, or deployment configuration.

#### Scenario: Run local Fast validation
- **WHEN** maintained Fast validation runs for an ordinary source change
- **THEN** architecture, cycles, dead source, current documentation, tracked artifacts, and publication boundaries are checked without a registry request

#### Scenario: Audit dependencies in CI
- **WHEN** Core or Full CI runs, or a local dependency input changes
- **THEN** the complete locked graph is checked at the configured failing severity

#### Scenario: Detect a vulnerable production package
- **WHEN** the installed locked dependency graph contains a failing advisory
- **THEN** validation fails with package and advisory metadata without printing secrets or organization data
