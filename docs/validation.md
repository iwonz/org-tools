# Validation

Validation separates quick local confidence from exhaustive regression. Every profile prints its
commands and wall times without organization values or credentials.

## Profiles

**Fast** is the required inner loop. It runs Biome, TypeScript, every Vitest test, the production
import graph, Knip, strict OpenSpec validation, `git diff --check`, and source publication safety in
parallel:

```sh
./bin/org-tools validate fast
```

Fast makes no registry request and starts no browser or database. The target is 15 seconds in a
warm toolbox. The dependency audit still runs in ordinary CI, and Changed adds it when a package
manifest or lockfile changes.

**Changed** combines the merge-base diff with staged, unstaged, and untracked paths. It always runs
Fast, explains every selected and skipped gate, then adds only owned evidence:

```sh
./bin/org-tools validate changed --base origin/main
```

Maintainers can reproduce one planner class with `--path <repository-path>`; normal delivery omits
that option so staged, unstaged, untracked, and committed changes are all considered.

- Runtime code selects a production build, publication scan, and bounded runtime probe.
- Product domains select their tagged Core browser scenarios.
- Visual domains select manifest modules for one screenshot pass and require no committed-image
  diff. `ORG_TOOLS_SCREENSHOT_IDS` can select exact scenario IDs for direct gallery work.
- Persistence changes select migration and restart proof.
- Package or delivery inputs select the registry audit or production image inspection.
- Validation infrastructure selects Full because it changes the evidence mechanism.

The wrapper uses a dedicated `org-tools-validation` Compose project, port `3101` by default, and
temporary PostgreSQL and Backup bind directories. Cleanup cannot open or alter the configured
development database. An ordinary Changed run targets five minutes or less; this is an observation
goal rather than a test timeout.

**Full Regression** is the exhaustive profile:

```sh
./bin/org-tools validate full
```

It adds the complete 47-scenario browser catalog, the large Editor timing run, migration/restart,
two complete 56-frame gallery passes with equal SHA-256 hashes, and production image inspection.
Use it manually for validation-infrastructure work and releases. GitHub runs the same evidence every
night, on manual dispatch, and for `release-please--*` pull requests.

## Browser and performance evidence

Browser titles carry `@core`, `@regression`, optional `@performance`, and product-domain tags.
Ordinary CI and Changed run selected Core domains. Full splits every Regression scenario exactly
once over four isolated PostgreSQL/runtime/browser shards, with one worker per shard. Playwright has
no automatic retry, so a flake remains visible.

The 20,000-Employee / 4,000-Unit case always blocks excess scans, renders, writes, layout work,
spatial candidates, or serialization. Ordinary runs do not fail on shared-runner timing. Full warms
the workload and records three pan and input windows. It fails when median pan p95 exceeds 100 ms,
median input p95 exceeds 200 ms, or any measured latency exceeds 1000 ms. Full CI retains the metric
JSON as a data-free artifact.

## Gallery evidence

Affected capture is one pass selected by manifest module or scenario ID:

```sh
ORG_TOOLS_SCREENSHOT_MODULES=editor ./bin/org-tools run pnpm screenshots:verify:affected
ORG_TOOLS_SCREENSHOT_IDS=editor-image-export ./bin/org-tools run pnpm screenshots:verify:affected
```

Full gallery verification remains available independently:

```sh
./bin/org-tools validate gallery
```

Every capture waits for local fonts, embedded images, and consecutive visual stability. Full keeps
exactly 56 declared PNGs and compares two SHA-256 manifests. Ordinary work visually reviews only
changed frames; Full Regression reviews the complete gallery.

## Architecture gate

`pnpm architecture:check` parses the production TypeScript graph with the installed compiler. It
rejects cycles and reverse dependencies across shared types, `i18n`/`lib`, server, stores,
components, and app/routes. API routes may use server, foundational logic, localization, and shared
types; shared contracts cannot depend on application code. Knip separately owns dead files and
dependency reachability.

## CI and delivery

Ordinary pull requests and `main` run parallel jobs for Fast plus dependency security, affected
build/runtime, affected Core browser domains, affected screenshots, and production image checks only
when delivery inputs changed. The stable `validate` job requires every selected job and accepts an
unselected job only as skipped.

After a normal push, confirm that CI, Container, and Release workflows were created and record their
links. Do not wait for completion unless the task publishes a version, the user requests it, or a
known failure needs repair. A later failed workflow is a new blocking defect and is never reported as
successful validation.

## Timing comparison

The previous complete local validation baseline was 723.30 seconds. Its Fast stage took 9.20–13.59
seconds, included network audit and four browser-list processes, and every delivered change repeated
the complete browser/gallery/image work.

The warmed host Fast profile now takes 6.86 seconds, a 25–50% reduction from that range. In the
isolated toolbox, a documentation-only Changed run took 13.20 seconds inside the runner and 15.82
seconds including container startup. A representative server-security Changed run took 155.06
seconds inside the runner and 208.05 seconds end to end: 7 affected browser scenarios ran instead of
the complete 47-scenario catalog, and the run remained below the five-minute observation target.
Planning docs, runtime, security, persistence, visual, performance, and delivery inputs took less
than one millisecond per case.

The required Full Regression took 1,041.67 seconds, 44% longer than the former 723.30-second
ordinary gate because it now records three performance samples and verifies every expensive surface
without retries. It passed all 47 browser scenarios and both passes of all 56 PNGs. Median pan p95
was 28 ms, median input p95 was 20 ms, and the largest measured interaction was 81 ms. This cost is
now paid nightly, manually, and for release pull requests instead of after ordinary product work.

The first Full attempt exposed one real evidence defect: a long Editor scenario exhausted the shared
60-second default and had previously relied on a CI retry. The scenario now declares its justified
180-second budget while global retries remain disabled. A focused browser dry run also exposed that
per-file batching treated a file with no grep matches as a failure; filtered runs now batch the
catalog once and retain a failing result when the complete filter matches nothing. This tooling-only
change produced no PNG differences.
