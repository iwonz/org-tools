## 1. Impact planning and fast validation

- [x] 1.1 Implement a conservative changed-path planner with human and JSON output, merge-base plus working-tree discovery, and full fallback.
- [x] 1.2 Add table-driven planner tests for docs, product areas, security/state, visual files, tooling, unknown paths, and missing bases.
- [x] 1.3 Add timed `validate:fast` and `validate:changed` runners plus a source-only publication scan.

## 2. Complete browser and gallery evidence

- [x] 2.1 Include the omitted persistence browser spec in the authoritative browser command.
- [x] 2.2 Add opt-in Playwright test-level sharding while preserving one-worker serial local behavior.
- [x] 2.3 Add a two-pass 56-PNG determinism command with per-pass timing and exact hash comparison.

## 3. Parallel CI and container reuse

- [x] 3.1 Split CI into static/runtime, four isolated browser shards, gallery, production image, and stable aggregate jobs with unconditional cleanup.
- [x] 3.2 Add bounded BuildKit cache reuse to CI and multi-architecture Container publication without skipping image checks, SBOM, or provenance.
- [x] 3.3 Prove all shards execute every browser and performance scenario exactly once against isolated PostgreSQL instances.

## 4. Workflow documentation

- [x] 4.1 Update AGENTS.md and developer documentation with fast, changed, and full stages and explicit authoritative-gate rules.
- [x] 4.2 Update project-tooling specifications and record before/after timing methodology and baseline results.

## 5. Validation and delivery

- [x] 5.1 Run formatter, lint, typecheck, complete unit tests, planner tests, dev probe, production build, all browser shards, two-pass gallery verification, public safety, image inspection, strict OpenSpec validation, and diff checks through Compose.
- [x] 5.2 Measure the optimized GitHub Actions and Container workflows against the 26:46 and 14:24 baselines and document actual results or concrete bottlenecks.
- [x] 5.3 Sync and archive the OpenSpec change, integrate fresh origin/main, push main, verify CI/GHCR/release state, remove the change branch, and confirm clean matching refs.
