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
   ./bin/org-tools validate fast
   ```

3. **Changed** runs Fast, then adds the development probe, production build, owned browser specs,
   gallery feedback, and publication scan selected by the conservative path plan:

   ```sh
   ./bin/org-tools validate changed --base origin/main
   ```

   An unavailable comparison base, an unknown path, or a validation-infrastructure change selects
   the complete expensive local plan. Unit tests are deliberately not selected by import graph: the
   whole suite is cheap and catches cross-module contracts. The wrapper starts and prewarms the
   development runtime when an affected browser check needs it, then restores the previous Compose
   state.

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

Each capture waits for bundled fonts and embedded images, disables transient animation, and accepts
the frame only after two consecutive bounded pixel samples agree. The existing antialiasing budget
applies only inside explicit raster-noise regions. A frame that never stabilizes fails with both
final samples in `test-results/screenshot-stability`; a cross-pass mismatch retains both complete
frame versions in `test-results/screenshot-determinism` and CI uploads the diagnostic artifact.

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

On the development machine, repeated `validate:fast` runs completed all seven cheap gates in
6.73–7.50 seconds. The same gates took about 20.5 seconds when invoked one after another, so
concurrent execution reduced wall time by 63–67% while still running all 393 unit tests.

The four clean browser shards completed in 2.4, 3.1, 2.7, and 3.1 minutes. Their local critical path
is therefore about 3.1 minutes, 61% below the previous 7.9-minute serial run, while coverage grew
from 44 to 47 tests. Running all four Chromium instances simultaneously on the same development
machine exhausted local browser resources; isolated GitHub runners avoid that constraint, while the
supported local command remains serial and the shards can be reproduced one at a time.

The two complete gallery passes took 198.62 and 168.71 seconds and produced identical hashes for all
56 PNG files. Gallery work was deliberately kept complete; CI overlaps it with the browser, static,
and image jobs instead of weakening it. A cold development-image rebuild also spent 113.8 seconds
downloading Chromium, which confirms the value of the bounded BuildKit cache added to CI.

The complete pull-request workflow finished in 11 minutes 28 seconds, down from 26 minutes 46
seconds: a 57% reduction in authoritative wall time. Its slowest browser shard took 7 minutes 26
seconds versus 16 minutes 54 seconds for the former serial browser job, a 56% reduction. The two-pass
gallery became the 11-minute 22-second critical evidence job. Parallelism increased summed runner
time from 26 minutes 46 seconds to about 45 minutes 20 seconds; this is an intentional tradeoff for
faster feedback while retaining every gate and adding the three previously omitted browser tests.

The optimized runs exposed infrastructure limits rather than hiding them. Chromium's shared disk
cache failed during isolated multi-tab runs, so the browser harness disables that cache while still
executing every request. A healthy API could precede the first cold Next.js page compilation, so the
development probe now performs a bounded page prewarm. Cold compilation also made the comprehensive
authorization scenario exceed its former five-minute timeout, and the 20,000-Employee autosave could
take longer than ten seconds to reach PostgreSQL; only those bounded waits were increased, without
weakening their assertions. The Container baseline spent 13 minutes 41 seconds of its 14 minutes 24
seconds in the multi-architecture build. The new workflows share bounded BuildKit inputs between the
verified production-image job and Container publication while keeping separate cache write scopes.

Stateful browser scenarios keep their normal product assertion deadline. When mandatory baseline
restoration begins, it receives a separate bounded cleanup reserve so an otherwise useful failure
cannot leave maintenance state behind and invalidate the remainder of its shard.

## Gallery stabilization follow-up

The first archived-state CI run exposed one real `demo-teams.png` mismatch after two otherwise
successful 56-frame passes. An unchanged rerun passed, proving that the fixed 1.5-second delay was
neither a sufficient readiness condition nor useful deterministic evidence. Visual inspection also
found that Administration grants came from PostgreSQL without an explicit aggregate order; the
server now orders them by permission and scope.

The replacement waits on resources and consecutive visual equality instead of elapsed time. On the
same isolated development runtime, the previous complete passes took 198.62 and 168.71 seconds.
Repeated stabilized runs took 142.68/92.66 and 116.55/94.02 seconds. Total gallery generation fell
from 367.33 seconds to 235.34–210.57 seconds, a 36–43% reduction, while all 56 hashes still matched
and every capture gained an explicit stability assertion. On GitHub's clean runners the stabilized
two-pass gallery completed in 9 minutes 32 seconds, down from 11 minutes 22 seconds in the first
optimized workflow, a further 16% reduction. The complete workflow finished in 9 minutes 37
seconds, 64% below the original 26-minute-46-second baseline. Its slowest browser shard took 7
minutes 50 seconds and all four shards passed.

The conservative local changed-path run selected no skips because validation infrastructure and a
server query changed. It completed all 396 unit tests, 47 browser tests, the 20,000/4,000 performance
scenario, production build, publication scans, and gallery feedback in 746.56 seconds. The serial
browser suite remained the local critical path at 601.88 seconds; the single gallery feedback pass
took 100.58 seconds.

A later `main` run retained the strict gate and exposed a second `demo-teams.png` mismatch: 242
ordinary one-channel antialiasing pixels and 24 pixels in the explicitly declared boss-marker
raster region. Each class stayed inside the existing 256-pixel allowance, but the old comparator
incorrectly combined them into 266. The comparator now applies the unchanged allowance to each
trust category independently. A large delta outside an explicit raster region, or either category
exceeding 256 pixels, still fails; accepted pass two output retains pass one's exact bytes so the
two SHA-256 manifests remain identical.
