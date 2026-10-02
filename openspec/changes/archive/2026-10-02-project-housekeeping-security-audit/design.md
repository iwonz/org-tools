## Context

Org Tools has crossed several architecture changes while keeping an append-oriented specification
history. The runtime is now an authenticated Next.js server with PostgreSQL, filtered projections,
Docker delivery, and a 56-frame gallery, but some canonical requirements still describe removed
browser-only, SQLite, State Import, Employee Import, and live-tab behavior. Static inspection also
found one unused UI module and duplicate UUID fallback code. A production dependency audit found
published advisories in the installed Next.js, Sharp, PostCSS, and Nano ID chain.

The security boundary remains the server: authorization and ACL filtering happen before payload
serialization, all mutations pass Origin, Fetch Metadata, media type, session, CSRF, parser, and
revision checks, and deployment data stays in external PostgreSQL and Backup paths. Housekeeping
must preserve this behavior and the exact database and State schemas.

## Goals / Non-Goals

**Goals:**

- Eliminate known production dependency advisories with the smallest compatible version updates.
- Make security auditing and repository hygiene repeatable in normal validation and CI.
- Remove only source that has no runtime, test, build, or script consumer.
- Use one cryptographically secure UUID implementation in supported runtimes.
- Reconcile current documentation and canonical capability requirements with implemented behavior.
- Prove the same UI, API, authorization, persistence, export, performance, and PNG behavior through
  the complete existing validation matrix.

**Non-Goals:**

- No product feature, visual design, permission, ACL, API, State, SQL schema, or migration change.
- No broad refactor of large working modules solely to reduce line count.
- No deletion of ignored local database, backup, report, or environment files owned by the user.
- No new runtime service, telemetry, remote scanner, or background network request.

## Decisions

### Patch the installed dependency graph and gate production advisories

Upgrade direct constraints to patched releases and resolve the lockfile so transitive PostCSS,
Nano ID, and Sharp copies leave vulnerable ranges. Add a named production audit command and include
it in fast/CI validation. This uses the package manager's registry advisory endpoint during explicit
validation only; the application runtime remains offline from third parties.

An allowlist was rejected because the reported advisories include reachable framework and image
processing packages and patched releases exist. A wholesale dependency refresh was rejected to
avoid unrelated compatibility risk.

### Treat dead-code evidence conservatively

Use TypeScript, Biome, import/reference search, package reachability, build output, and tests
together. Remove a file only when it has no source, dynamic, configuration, script, or test consumer.
Keep declaration companions and command-invoked scripts even when a generic static tool cannot infer
their use. Do not mass-remove exported symbols because many are test seams or module APIs.

### Require platform cryptography for persistent identifiers

Supported browsers and Node provide `crypto.randomUUID()`. A shared helper will call that primitive
and fail closed if the supported platform contract is broken; `Math.random()` UUID fallbacks and
duplicated implementations are removed. This does not alter valid ID shape or persisted schemas.

### Extend existing publication checks instead of adding a remote scanner runtime

The source/image safety checks remain deterministic local programs. They inspect tracked paths,
Docker ignore coverage, the production build and runtime image, and reject secrets, database or
backup material, generated reports, obsolete delivery surfaces, and unsafe package state. Package
advisory lookup is a separate explicit build-time command so no runtime request or organization data
is involved.

### Reconcile the current source of truth, not historical archives

Canonical capabilities, current docs, templates, and contributor guidance are updated. Archived
OpenSpec changes remain immutable history and are excluded from obsolete-term assertions. Current
requirements use PostgreSQL, per-account UI state, authorized projections, Backup/Restore, and the
authenticated server gallery consistently.

## Risks / Trade-offs

- **Framework patch updates can change generated output** → keep updates within the current major,
  run unit/browser/build/image/performance tests, and compare every PNG twice.
- **Registry advisory availability can affect explicit audit runs** → keep runtime independent and
  surface network failure rather than silently passing; Dependabot remains an additional signal.
- **Static dead-code tools can produce false positives for scripts and declaration companions** →
  require reference and execution evidence before deletion and retain documented exceptions.
- **Security headers can break legitimate framework behavior if tightened casually** → audit them,
  but change only settings supported by the current same-origin application and prove all routes.
- **Specification cleanup can erase still-valid detail** → replace complete requirement blocks,
  validate strictly, and compare every changed statement with code and maintained tests.

## Migration Plan

There is no data migration. Build a new image from the patched lockfile, run the existing PostgreSQL
migrations unchanged, and deploy normally. Rollback uses the previous application image because the
database schema and stored documents are identical.

## Open Questions

None. Audit findings that would require a new product contract or data migration are deferred to a
separate OpenSpec change instead of being folded into housekeeping.
