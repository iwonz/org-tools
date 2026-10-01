## Context

The current validation commands are individually reliable, but the delivery path repeats them and
the CI workflow executes every expensive gate in one job. The latest measured main run lasted
26:46: the complete Vitest suite used about 3.5 seconds, while the serial Playwright browser step
occupied most of the critical path. The multi-architecture Container workflow ran independently for
14:24. The maintained browser command also omitted `state.spec.ts`, so three persistence/security
scenarios were present in source but were not executed by the authoritative browser suite. Enabling
them exposed invalid UI input returning 500 instead of 400, an SSE close race after aborted browser
sessions, and semantically identical cross-tab writes conflicting only on `updatedAt`; these server
boundaries are repaired as part of restoring the intended coverage. The client retries a stale
write only after proving that the server still matches its last committed business document, so a
real concurrent edit continues to produce a conflict instead of being overwritten.

Validation has two different purposes: rapid feedback while code is changing and complete evidence
before delivery. Treating both purposes as the same serial command spends time without improving
the final confidence. The new flow keeps the full evidence and makes the distinction explicit.

## Goals / Non-Goals

**Goals:**

- Return useful affected-change feedback quickly and explain every selected gate.
- Preserve complete unit, browser, performance, gallery, publication, migration, and image coverage
  for every pull request and main commit.
- Reduce CI wall time by running independent gates concurrently and distributing browser tests
  across isolated database/application instances.
- Record stage and command durations so regressions are measurable rather than anecdotal.
- Fail safely: an unknown path or invalid comparison base selects broader coverage.

**Non-Goals:**

- Do not make unit execution selective; the full suite is already cheap.
- Do not share PostgreSQL, application state, sessions, or files between browser shards.
- Do not weaken retries, assertions, browser diagnostics, performance fixtures, screenshot count, or
  image/publication scans.
- Do not change product features, State, PostgreSQL schema, or product localization. Runtime defects
  proven by restored authoritative tests are repaired in the same change rather than suppressed.

## Decisions

### Separate fast, changed, and authoritative full stages

`validate:fast` runs the complete cheap static and unit gates concurrently. `validate:changed`
computes a conservative plan from the merge-base diff plus staged, unstaged, and untracked paths,
runs the fast stage, and adds only relevant runtime/browser/visual feedback. It prints paths,
reasons, commands, durations, and skipped expensive gates.

The changed stage is not a delivery certificate. GitHub Actions remains authoritative and always
runs all browser scenarios, the performance case, two deterministic gallery passes, production
build/publication checks, and production image inspection. This avoids converting a path map into a
security boundary.

Alternative considered: use Vitest related-test selection everywhere. It saves only a few seconds
and can miss non-import dependencies such as schemas, migrations, and generated projections, so the
complete unit suite remains mandatory.

### Use a pure conservative impact planner

The planner is a side-effect-free module covered by table-driven unit tests. Known documentation and
OpenSpec-only changes select the source publication scan and fast gates. Product areas select owned
browser specs. Cross-cutting build, dependency, workflow, test infrastructure, or unknown paths
select every expensive local gate. A missing base revision also selects every gate.

The planner never reads organization content and emits no persisted artifact. Its output contains
repository paths and validation metadata only.

### Shard browser tests only across isolated runtimes

Playwright test-level sharding is enabled only with an explicit environment flag. Normal local
execution remains one worker and preserves its current behavior. CI uses four matrix jobs; every job
creates its own external temporary PostgreSQL and Backup directories, Compose project, migrations,
app, session data, and browser process. Within a shard, one worker keeps each database mutation
serial. The full browser command includes `smoke.spec.ts`, `localization.spec.ts`,
`auth-access.spec.ts`, and the previously omitted `state.spec.ts`.

Alternative considered: raise Playwright workers against one application/database. Tests replace
organization state and security configuration, so concurrent workers would create race conditions
and false failures.

### Parallelize CI by evidence type

CI has independent static/runtime, browser-shard, gallery, and image jobs plus a stable `validate`
aggregator. Gallery generation remains unsharded because its seven workflows update one exact set of
56 files; the job runs the complete gallery twice and compares in-memory SHA-256 manifests. The
production image job remains independent and uses the same inspection script. Every job cleans its
Compose resources even after failure.

The Container workflow keeps multi-architecture publication and adds BuildKit GitHub cache. Cache
hits may skip repeated immutable layers but do not skip Dockerfile steps whose inputs changed, image
publication, SBOM, or provenance.

### Measure command wall time in the repository runner

The runner uses argument arrays rather than shell interpolation, streams child output, terminates on
the first failed dependency stage, and prints a final timing table. Independent cheap commands run
concurrently; runtime commands with shared outputs remain ordered. Structured JSON planning is
available for CI and tests, while human output explains the selection.

## Risks / Trade-offs

- **Impact rules become stale** → Unknown paths select full coverage, the planner has exhaustive
  fixtures, and full CI never uses the changed plan to skip evidence.
- **Browser tests have hidden order dependencies** → Shards use clean databases; executing every
  scenario this way exposes and removes such dependencies instead of masking them.
- **Four shards consume more runner minutes** → Wall time is prioritized for delivery; one-worker
  shards are bounded, and Docker layer caching limits repeated setup.
- **Parallel failures produce several logs** → The final aggregator names the failed evidence job,
  while each command retains Playwright traces and existing diagnostics.
- **Gallery double generation modifies the worktree** → Both passes target the same maintained files;
  a mismatch fails with the exact filenames and the second output remains available for inspection.

## Migration Plan

1. Add and unit-test the impact planner, source-only publication scan, timed runner, and screenshot
   determinism command.
2. Add the omitted browser state spec and opt-in fully parallel Playwright sharding.
3. Run every browser shard against isolated local Compose projects to prove independence.
4. Replace the serial CI job with parallel evidence jobs while retaining the `validate` check name.
5. Measure the first main run against the recorded 26:46 CI and 14:24 Container baselines.

Rollback is a normal revert of tooling files; no application data or schema is involved.

## Open Questions

None. The first CI run supplies the final measured shard balance and may inform a later shard-count
adjustment without changing the validation contract.
