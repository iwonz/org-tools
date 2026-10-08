## Why

The repository's delivery checks are reliable but make ordinary changes wait for the same complete
browser, performance, image, and 56-frame gallery evidence that is useful only for broad regression
and release confidence. Tight wall-clock assertions on shared CI runners also create retries without
proving an architectural or functional defect, while dependency direction and cycle boundaries are
not enforced automatically.

## What Changes

- Replace the single heavy completion path with Fast, affected Changed, Core CI, and Full Regression
  profiles that state exactly which evidence they provide.
- Keep complete static, unit, security, compilation, runtime, and key browser protection on ordinary
  changes while moving exhaustive browser, timing, migration, image, and two-pass gallery evidence to
  nightly, manual, and Release Please runs.
- Separate deterministic 20,000-Employee / 4,000-Unit structural budgets from noisy browser timing;
  ordinary validation blocks on the former and nightly validation records repeated timing samples
  with broad sustained-regression ceilings.
- Generate and compare only affected maintained screenshots for ordinary visual changes. Preserve
  two complete deterministic 56-frame passes in Full Regression.
- Add a TypeScript import-graph gate for layer direction and production cycles, and move shared
  export/display contracts out of stores so the boundary has no exceptions.
- Let delivery finish after local affected evidence and a confirmed remote workflow start. Waiting
  for GitHub Actions, GHCR, or Release Please remains required only for release-specific work or an
  explicit request.
- Preserve product behavior, authorization, privacy, exact State, PostgreSQL schema, API contracts,
  exports, and localization.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `project-tooling`: Define the lean validation profiles, asynchronous post-push delivery contract,
  architecture dependency guard, stable performance policy, affected screenshot evidence, and
  scheduled/release Full Regression authority.

## Impact

The change affects repository validation scripts, Playwright organization, screenshot tooling,
GitHub Actions, shared TypeScript type ownership, OpenSpec requirements, and developer documentation.
It adds no runtime dependency, product route, persistent field, SQL migration, or visible UI change.
Organization fixtures remain confined to isolated validation PostgreSQL instances, and external
network access remains limited to explicit dependency and publication checks.
