## 1. Contracts and dependencies

- [x] 1.1 Replace complete browser State contracts with organization document, authorized projection, security, session, permission, policy, command, Backup, and per-account UI types.
- [x] 1.2 Add PostgreSQL, Argon2, validation, compression, and cryptography dependencies and remove Pages/SQLite-only dependencies and workspace entries.
- [x] 1.3 Add exact environment parsing and tests for secrets, origins, PostgreSQL settings, and external storage paths.

## 2. PostgreSQL runtime

- [x] 2.1 Add checked forward-only SQL migrations for organization, identities, roles, grants, policies, accounts, sessions, UI state, rate limits, audit, and migration metadata.
- [x] 2.2 Implement the advisory-locked migration runner, least-privilege application role preparation, schema readiness, and health endpoints.
- [x] 2.3 Implement transactional organization repository commands with expected revisions, identity-index synchronization, audit append, per-account UI state, and bounded server events.
- [x] 2.4 Remove the SQLite repository/config/API and prove no runtime `node:sqlite` or `/api/state` remains.

## 3. Authentication and session security

- [x] 3.1 Implement normalized email identity, password policy, Argon2id hashing/rehash, setup token bootstrap, login, logout, forced password change, and generic failures.
- [x] 3.2 Implement opaque hashed sessions, idle/absolute expiry, secure cookie policy, CSRF/origin/Fetch-Metadata checks, revocation, and PostgreSQL rate limits.
- [x] 3.3 Implement the interactive Super Administrator recovery command and security-safe authentication audit events.

## 4. Authorization and projection

- [x] 4.1 Implement the permission registry, valid scope matrix, seeded system roles, additive direct grants, last-Super-Administrator invariant, and effective access evaluation.
- [x] 4.2 Implement system-View Manager relationships, safe branch authorization, resource policy parsing/inheritance, safe defaults, restrictive Tags, and policy-reference maintenance.
- [x] 4.3 Implement the authorized projection engine and bounded cache for fields, Employees, Tags, Units, Slots, Views, UI options, Calendar, Download, Editor, accessible labels, and PNG inputs.
- [x] 4.4 Replace whole-state client writes with authenticated bootstrap, strict command, UI-state, and SSE transports including conflict/refetch handling.

## 5. Account and Administration interface

- [x] 5.1 Add responsive localized Setup, Login, forced password change, logged-out loading/error states, and account menu.
- [x] 5.2 Add Super-Administrator Users management for Employee linking, roles, direct grants, resets, session revocation, activation, promotion, demotion, and protected email changes.
- [x] 5.3 Add Roles, Access, and Audit Administration tabs with bounded tables, policy editors, effective previews, and safe destructive flows.
- [x] 5.4 Gate every navigation destination, form action, Editor command, Download, image export, Calendar, and model/catalog action from effective access while retaining server enforcement.

## 6. Backup, Restore, and transfer removal

- [x] 6.1 Implement current-format compressed AES-256-GCM Backup with Argon2id passphrase derivation, reauthentication, complete security data, and secret exclusions.
- [x] 6.2 Implement detached Restore validation, maintenance lock, external encrypted recovery Backup, atomic replacement, rollback, audit, and global session revocation.
- [x] 6.3 Remove State Import/Export and Employee Import code, messages, fixtures, routes, tests, and documentation; retain authorized Data Download and image export.

## 7. Container development and deployment

- [x] 7.1 Add `.env.example`, safe idempotent environment initialization, storage-path guards, `.dockerignore`, and tracked-file/data leak checks.
- [x] 7.2 Add the multi-stage non-root standalone Docker image, production Compose services with PostgreSQL bind storage and migration dependency, and readiness checks.
- [x] 7.3 Add the Compose development/toolbox override and wrappers for up/down/logs/format/lint/typecheck/tests/OpenSpec/screenshots without host Node or pnpm.
- [x] 7.4 Add the safe allowlisted Docker Run wrapper and verify persistence, migration, restart, read-only root, and external Backup storage.

## 8. CI and releases

- [x] 8.1 Remove the Pages workspace, scripts, tests, build output, and workflow; update CI for ephemeral PostgreSQL, Compose, authenticated browser suites, image inspection, and publication safety.
- [x] 8.2 Add Release Please v5 configuration for initial `v1.0.0`, conventional release notes, root package version, and CHANGELOG.
- [x] 8.3 Add public GHCR multi-architecture edge/SHA and SemVer publication with OCI metadata, SBOM, provenance, stable latest rules, and Dependabot updates.

## 9. Tests and performance

- [x] 9.1 Add unit/integration matrices for password/session/CSRF/rate-limit behavior, permissions/scopes/policies, identity invariants, audit, revisions, migrations, and restore rollback.
- [x] 9.2 Add direct-API leakage tests for hidden fields, restrictive Tags, Employees, Units, Slots, Views, filters, counts, Calendar, Download, PNG, unknown IDs, logs, and server events.
- [x] 9.3 Add browser coverage for Setup, Login, forced password, Employee/Manager/custom/Super-Administrator contexts, Administration, Backup/Restore, session invalidation, six locales, RTL, and both themes.
- [x] 9.4 Rebuild the 20,000-Employee/4,000-Unit performance fixture and verify bounded projection, cache invalidation, virtualization, Editor geometry, and output generation.

## 10. Documentation and gallery

- [x] 10.1 Update README, AGENTS, architecture, privacy, performance, usage, security, contributing, and screenshot documentation for PostgreSQL, access control, Compose, Docker Run, Backup, reverse proxy, upgrades, and releases.
- [x] 10.2 Complete and validate all six message catalogs, removing obsolete Pages/SQLite/Import copy and raw error fallbacks.
- [x] 10.3 Replace obsolete frames with Setup/Login, Users, Roles/Access, Audit, and Backup/Restore while retaining exactly 56 declared PNGs and nine current featured workflows.

## 11. Owned data conversion

- [x] 11.1 Stop the owned runtime, inspect the configured SQLite source, and create a timestamped ignored external backup of the complete database family.
- [x] 11.2 Run an external uncommitted exact-shape converter into empty PostgreSQL, increment revision once, build identities/roles/policies/bootstrap UI, and compare all source and target business values.
- [x] 11.3 Validate the detached candidate and committed rows with production parsers, complete first-Super-Administrator setup, restart normally, and record conversion evidence without retaining the converter or data artifacts.

  Conversion evidence (2026-10-01): the ignored SQLite family was backed up under
  `$HOME/.org-tools/backups/sqlite/2026-09-30T12-23-29.974Z`; its production-parsed revision
  `37911` contained 152 Employees, 35 missing emails, and no duplicate normalized non-empty
  emails. The detached PostgreSQL candidate under
  `$HOME/.org-tools/backups/postgres-converted-candidate/2026-09-30T12-30-03.495Z` parsed at
  revision `37912`, retained all business IDs and values, created 152 identity rows and the three
  system roles, and was installed into the configured external bind path. Checked migrations
  `0001` and `0002` reopen idempotently. First-Super-Administrator setup, authenticated login,
  normal restart, readiness, and login after restart all succeeded. The converter and database
  artifacts remain outside the repository.

## 12. Validation and delivery

- [x] 12.1 Run containerized format, lint, typecheck, unit/integration tests, development probe, production build, browser tests, PostgreSQL migration/restart tests, image build/inspection, public checks, strict OpenSpec validation, and `git diff --check`.
- [x] 12.2 Generate the 56-PNG gallery twice, compare SHA-256 hashes, and visually inspect every image.
- [x] 12.3 Synchronize and archive the OpenSpec change, validate no active changes, commit with `Release-As: 1.0.0`, integrate fresh `origin/main`, merge and push `main`, and remove the change branch.
- [x] 12.4 Verify the Release Please `v1.0.0` PR and GitHub Release, public GHCR edge/SHA/SemVer manifests, anonymous pull, SBOM/provenance, clean synchronized refs, and no repository data leakage.
