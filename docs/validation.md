# Validation

Validation has separate feedback and delivery stages. A selective result helps during development;
only the complete CI matrix is delivery evidence.

## Stages

1. **Plan** explains the changed paths, selected checks, skipped expensive feedback, and why:

   ```sh
   ./bin/org-tools run pnpm validation:plan --base origin/main
   ```

2. **Fast** runs the complete inexpensive gates concurrently: lint, typecheck, all unit tests,
   browser-shard partition proof, strict OpenSpec validation, diff checking, and the source-only
   publication scan:

   ```sh
   ./bin/org-tools run pnpm validate:fast
   ```

3. **Changed** runs Fast, then adds the development probe, production build, owned browser specs,
   gallery feedback, and publication scan selected by the conservative path plan:

   ```sh
   ./bin/org-tools run pnpm validate:changed --base origin/main
   ```

   An unavailable comparison base, an unknown path, or a validation-infrastructure change selects
   the complete expensive local plan. Unit tests are deliberately not selected by import graph: the
   whole suite is cheap and catches cross-module contracts.

4. **Complete delivery** is always run by GitHub Actions for pull requests and `main`. Independent
   jobs cover static/runtime checks, four isolated browser shards, two full gallery passes, and the
   production image. The stable `validate` job succeeds only when all evidence jobs succeed.

## Isolation and coverage

The authoritative browser command contains `smoke`, localization, authorization, and persistence
specs. Four CI shards divide all Playwright tests exactly once. Each shard owns a separate
PostgreSQL directory, backup directory, Compose project, application, sessions, browser, and report
directory; tests inside a shard use one worker. Ordinary local browser execution remains serial.

Use this structural proof after changing browser discovery or sharding:

```sh
./bin/org-tools run pnpm test:browser:shards
```

The maintained gallery is still generated twice in full. The command fails unless exactly 56
declared PNG files exist and both SHA-256 manifests match:

```sh
./bin/org-tools run pnpm screenshots:verify
```

## Timing baseline

The last serial `main` CI before this change took 26 minutes 46 seconds. The separate Container
workflow took 14 minutes 24 seconds. A local 44-test browser run took about 7.9 minutes, two gallery
passes took about 5.6 minutes together, and all 384 unit tests took about 3.5 seconds. The browser
suite had unintentionally omitted three persistence tests; the new complete suite contains 47. The
restored tests found real issues: invalid UI input returned 500 instead of 400, interrupted SSE
streams could close twice, and equal cross-tab writes could conflict only because their timestamps
differed. A following edit could then use the stale revision. All are fixed rather than excluded
from the suite; retry is allowed only after a full business-document equality check.

Compare wall time, not summed runner time. The optimized CI makes browser shards, gallery, static
checks, and image inspection concurrent, so its critical path is the slowest complete evidence job.
Validation logs report every command duration and overall stage duration without organization data
or credentials.

## Measured result for this change

On the development machine, `validate:fast` completed all seven cheap gates in 7.71 seconds. The
same gates took about 20.5 seconds when invoked one after another, so concurrent execution reduced
wall time by about 62% while still running all 392 unit tests.

The four clean browser shards completed in 2.4, 3.1, 2.7, and 3.1 minutes. Their local critical path
is therefore about 3.1 minutes, 61% below the previous 7.9-minute serial run, while coverage grew
from 44 to 47 tests. Running all four Chromium instances simultaneously on the same development
machine exhausted local browser resources; isolated GitHub runners avoid that constraint, while the
supported local command remains serial and the shards can be reproduced one at a time.

The two complete gallery passes took 198.62 and 168.71 seconds and produced identical hashes for all
56 PNG files. Gallery work was deliberately kept complete; CI overlaps it with the browser, static,
and image jobs instead of weakening it. A cold development-image rebuild also spent 113.8 seconds
downloading Chromium, which confirms the value of the bounded BuildKit cache added to CI.
