## ADDED Requirements

### Requirement: Changed validation is explanatory and conservative
The repository SHALL provide a changed-file validation stage that compares the merge base plus
staged, unstaged, and untracked paths, runs every cheap static and unit gate, and selects relevant
runtime, browser, visual, and publication feedback. The stage MUST print the selected gates and
reasons. An unavailable base, an unknown path, or validation-infrastructure change MUST select the
complete expensive local plan.

#### Scenario: Validate a documentation-only change
- **WHEN** only known documentation and OpenSpec paths changed
- **THEN** complete lint, typecheck, unit, specification, diff, and source-publication checks run while runtime, browser, gallery, and image feedback are explicitly skipped

#### Scenario: Validate an unknown path
- **WHEN** the planner receives a changed path without an owned impact rule
- **THEN** it selects every runtime, browser, gallery, build, and publication gate and explains the fallback

### Requirement: Complete validation remains authoritative
Changed validation MUST NOT replace complete delivery validation. Every pull request and main commit
SHALL run the full unit suite, all browser and performance scenarios, two complete 56-image gallery
passes with matching SHA-256 manifests, production build and publication scanning, migration-backed
runtime checks, and production image inspection.

#### Scenario: A changed stage skips an unrelated browser suite
- **WHEN** affected feedback completes with one or more expensive gates skipped
- **THEN** the authoritative CI still executes every browser, performance, gallery, and image gate before reporting success

### Requirement: Full browser coverage uses isolated shards
CI SHALL distribute browser scenarios across bounded shards only when every shard owns an isolated
PostgreSQL database, application runtime, migration run, session set, browser process, and storage
paths. Tests inside one shard SHALL remain serial. Ordinary local browser execution SHALL remain
serial unless isolated sharding is explicitly requested.

#### Scenario: Run four browser shards
- **WHEN** authoritative CI executes the browser suite
- **THEN** every smoke, localization, authorization, persistence, and performance scenario runs exactly once across four isolated shards without shared mutable state

#### Scenario: Run the ordinary local browser command
- **WHEN** a contributor runs the browser command without the sharding flag
- **THEN** Playwright uses one worker and preserves the existing serial database behavior

### Requirement: Validation reports comparable timing evidence
Repository validation SHALL report command and stage wall time, success or failure, and the selected
plan without recording organization values or credentials. CI SHALL retain stable evidence job names
and one aggregate validation result.

#### Scenario: Compare validation revisions
- **WHEN** staged or complete validation finishes
- **THEN** its log contains durations and gate results that can be compared with a prior commit while containing no application data
