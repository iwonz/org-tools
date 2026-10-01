## Why

The delivery checks preserve strong regression coverage, but they repeat cheap full checks and run
the expensive browser, gallery, and image work serially. The latest main validation took 26 minutes
46 seconds even though the complete unit suite took about 3.5 seconds; validation should surface
relevant failures quickly while retaining the complete release evidence.

## What Changes

- Add a deterministic changed-file planner with a conservative full-suite fallback and an
  inspectable explanation for every selected or skipped gate.
- Keep the complete lint, typecheck, unit, OpenSpec, browser, performance, gallery, publication,
  migration, and image coverage as the authoritative delivery gate; staged checks accelerate local
  feedback and never replace the full remote gate.
- Split independent GitHub Actions work into static, browser-shard, gallery, and production-image
  jobs. Browser shards use isolated PostgreSQL and application instances so mutable organization
  state cannot cross shards.
- Run every browser scenario across balanced shards by enabling Playwright test-level sharding only
  when each shard owns an isolated runtime. Keep ordinary local execution serial.
- Add one repository command for changed validation and one for complete validation, structured
  timing summaries, planner tests, and documentation for choosing each stage.
- Avoid selective unit execution because the full unit suite is already cheap and provides useful
  cross-module safety. Performance coverage remains in the full browser matrix.
- Keep all organization data local to the ephemeral Compose environments. Validation metadata
  contains only paths, gate names, durations, and exit status.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `project-tooling`: Define staged changed-file feedback, conservative fallback, isolated full
  browser sharding, timing evidence, and the authoritative complete delivery gate.
- `postgresql-runtime`: Preserve valid idempotent and semantically safe cross-tab writes while
  rejecting real revision conflicts, and close interrupted event streams once.
- `single-state-runtime`: Reject malformed per-account UI payloads as invalid input without a write.

## Impact

- Affects root validation scripts and package commands, Playwright configuration, Docker Compose
  wrappers, GitHub Actions, AGENTS.md, and developer documentation.
- Adds no runtime dependency, persistent State, PostgreSQL schema, localization, or exported-data
  change. Restored persistence coverage repairs strict UI input errors, interrupted SSE cleanup,
  and timestamp/order-safe cross-tab conflict handling.
- Existing individual commands remain available. The full suite continues to run for every pull
  request and main push, while local repeated work can use the changed stage until final delivery.
