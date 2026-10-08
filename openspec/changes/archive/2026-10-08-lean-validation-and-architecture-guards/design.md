## Context

The current Fast stage is inexpensive, but an ordinary UI change causes Changed validation to run a
production build, a broad stateful browser file, and often a complete 56-frame gallery. Delivery
instructions then repeat complete browser, performance, gallery, image, and publication evidence
locally and wait for the same remote work after pushing. The performance scenario mixes stable
algorithmic counters with tight browser wall-clock thresholds on shared runners; the latter can fail
once and pass on retry without a code change. Static analysis finds dead files and dependency
problems, but production import direction and cycles are not checked.

## Goals / Non-Goals

**Goals:**

- Keep ordinary local feedback under a few minutes without reducing static, unit, security, build,
  runtime, or key authorization protection.
- Make every selected and skipped expensive check explainable from changed paths and owned domains.
- Preserve exhaustive regression, large-model, image, and deterministic gallery evidence on a
  nightly, manual, and release cadence.
- Replace noisy ordinary timing gates with stable structural budgets and repeated nightly metrics.
- Enforce acyclic dependency direction between contracts, foundational logic, server, stores, UI,
  and routes.

**Non-Goals:**

- No product, authorization, State, SQL schema, route, export, localization, or visual change.
- No formal SOLID score, file-size limit, duplicate-code percentage, or new runtime dependency.
- No weakening of server-side permission, ACL, request-security, publication-safety, or unit tests.

## Decisions

### Use four explicit validation profiles

Fast runs non-networked inexpensive gates concurrently: Biome, TypeScript, all Vitest tests, Knip,
architecture, OpenSpec, diff, and source publication safety. Changed adds only owned build, runtime,
browser-domain, screenshot, migration, dependency-audit, and image feedback. Core CI runs the same
ordinary evidence in isolated jobs and always includes the dependency audit. Full Regression runs
all browser scenarios, repeated performance timing, migration/restart, production-image inspection,
and two complete gallery passes.

Unknown application paths select every Core domain rather than Full Regression. Validation or test
orchestration changes select Full locally because they change the evidence mechanism itself. Full
Regression is also scheduled nightly, manually dispatchable, and required on Release Please PRs.

### Give browser and screenshot scenarios explicit ownership

Split the broad smoke declaration into domain specifications and tag Playwright tests as Core,
Regression, Performance, and one or more product domains. The path planner outputs domain tags, and
the runner passes them without shell interpolation. Core contains bounded end-to-end proof for
authentication/session security, authorization projection, Employee/Unit persistence, Editor,
authorized output, Backup/Restore, and LTR/RTL. Detailed interaction coverage remains in Full.

Screenshot scenarios keep their manifest IDs and modules. An affected run filters the existing
capture file by selected IDs/modules, generates once, and requires no diff from committed PNGs. A
shared visual primitive may select the complete gallery once. Full performs the existing two-pass
hash comparison and verifies the committed gallery. Only changed PNGs require ordinary visual
review.

### Separate structural performance from runner timing

The affected Editor performance scenario retains all assertions about serialization, writes,
spatial candidates, layout computations, render counts, and bounded indexes, but has no elapsed
frame or input threshold. Full warms the workload and records three timing windows. It fails only
when the median pan p95 exceeds 100 ms, the median input p95 exceeds 200 ms, or one measured latency
exceeds 1000 ms. Metrics are written to the GitHub summary and a small artifact containing no
organization values. Global Playwright retries are removed.

### Enforce a production import graph with existing TypeScript tooling

A repository script uses the TypeScript parser and resolver already installed by the project. It
checks static and dynamic production imports, reports a concrete dependency chain for cycles, and
enforces this direction:

`packages/types` -> `i18n/lib` -> `server` or `stores` -> `components` -> non-API `app`, while API
routes may depend only on `server`, `lib`, `i18n`, and shared types. Server, stores, and components
remain peer branches and cannot import a later or sibling runtime layer. Existing export/display
types owned by stores move to shared contracts or foundational logic instead of receiving an
exception. Knip continues to own dead source and declared dependency reachability.

### Treat remote completion as asynchronous ordinary delivery

Before pushing, Changed validation is the required local certificate. After pushing, delivery
confirms that expected CI, Container, and Release workflows were created and records their URLs;
ordinary work does not wait for completion. Release-specific changes, explicit publication tasks,
and user requests still wait for the relevant remote result. A failure discovered later remains a
new highest-priority repair and is never described as a successful remote validation.

## Risks / Trade-offs

- **A stale path map could skip useful local feedback** -> unknown product paths select all Core
  domains, the planner is table-tested, and nightly/release Full ignores the map.
- **A regression reaches `main` before nightly** -> all unit/security/build checks and key browser
  boundaries remain in Core; detailed UI regressions have bounded exposure until the next nightly.
- **Screenshot ownership becomes stale** -> manifest modules are validated, shared visual paths
  select all frames once, and Full checks all 56.
- **Layer rules reject current coupling** -> move shared contracts to their actual owner and allow no
  grandfather exceptions.
- **Broad nightly timing ceilings miss small regressions** -> publish all samples for trend review;
  deterministic structural budgets remain blocking on affected Editor work.

## Migration Plan

Introduce and test the planner/profile contracts first, then architecture checks and shared type
ownership, then browser/performance/screenshot selection, and finally replace CI and documentation.
Run the new Full profile once before integration to prove that every previous scenario still runs.
Rollback is a normal tooling revert; persistent data and product output are unchanged.

## Open Questions

None.
