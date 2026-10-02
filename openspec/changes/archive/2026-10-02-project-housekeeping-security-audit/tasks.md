## 1. Repository and security inventory

- [x] 1.1 Inventory tracked and ignored artifacts, package reachability, scripts, build context, workflows, and current documentation; record only evidence-backed cleanup targets.
- [x] 1.2 Audit authentication, request security, authorization projections, persistence, backup, export, Docker, and publication boundaries for unsafe input, disclosure, credential, and privilege patterns.
- [x] 1.3 Run dependency and static dead-source audits and classify true findings separately from command, declaration, test-seam, and framework false positives.

## 2. Dependency and code hygiene

- [x] 2.1 Upgrade the vulnerable production framework, image, CSS, and transitive dependency chain to patched compatible releases and regenerate the frozen lockfile.
- [x] 2.2 Add a maintained locked-dependency audit command to fast and CI validation with secret-free output and focused tests for validation orchestration.
- [x] 2.3 Remove proven unused source and replace duplicate non-cryptographic UUID fallbacks with one platform-cryptographic helper plus regression tests.
- [x] 2.4 Extend source, build-context, and image publication checks for environment, database, Backup, report, credential, and obsolete-runtime artifacts without reading sensitive contents into logs.

## 3. Documentation consistency

- [x] 3.1 Reconcile canonical capabilities with the authenticated PostgreSQL runtime, per-account UI state, Backup/Restore, authorized exports, current gallery, and removed legacy surfaces.
- [x] 3.2 Update README, AGENTS, architecture, privacy, performance, validation, usage, security, contribution and issue guidance where audit findings show inconsistent current behavior.
- [x] 3.3 Add automated current-documentation and repository-hygiene assertions while excluding immutable historical OpenSpec archives.

## 4. Verification and delivery

- [x] 4.1 Run changed validation while implementing, then run formatting, lint, typecheck, all unit tests, development probe, production build, production dependency audit, publication scan, and strict OpenSpec validation.
- [x] 4.2 Run PostgreSQL migration/restart, complete isolated browser shards, performance scenario, production image inspection, and verify no State or schema migration is required.
- [x] 4.3 Generate all 56 PNGs twice, compare SHA-256, and visually inspect every frame to confirm no visible behavior changed.
- [x] 4.4 Synchronize and archive the OpenSpec change, integrate fresh origin/main, push main, remove the change branch, and verify clean matching refs, release automation, and GHCR publication.
